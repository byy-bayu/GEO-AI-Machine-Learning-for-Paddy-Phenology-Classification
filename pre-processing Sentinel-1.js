//---------------------------------------------------------------------------//
// AOI
//---------------------------------------------------------------------------//

/** AOI adalah Sawah LBS Kec. Anjatan **/
// var AOI = ee.FeatureCollection('projects/ee-bayuardianto104/assets/Indramayu_Research/Anjatan_SwhIr');   // LSD Kec. Anjatan

/** AOI adalah Sawah LBS Kab. Indramayu **/
var AOI_raster = ee.Image('projects/ee-bayuardianto104/assets/Indramayu_Research/LBS_Kab_Indramayu')
var AOI_to_vector = AOI_raster.updateMask(AOI_raster.lte(1)); 
var AOI = AOI_to_vector
    .reduceToVectors({
        geometryType: 'polygon',
        reducer: ee.Reducer.countEvery(),
        scale: 30,  
        maxPixels: 1e8
    })
    .filter(ee.Filter.gt('count', 10));

Map.addLayer(AOI,false);
Map.centerObject(AOI.first().geometry());

//---------------------------------------------------------------------------//
// KOREKSI CITRA 
//---------------------------------------------------------------------------//

/**
 * koreksi noise citra: remove border noise citra
 * koreksi geometrik: despeckle
 * koreksi radiometrik: koreksi insiden angle, Terrain Flattening Correction
                        * Gamma Nought (γ°): Normalisasi terhadap area tegak lurus terhadap arah pancaran radar
 
 * Data asli dari GRD  dalam bentuk dB
   Semua koreksi geometrik (speckle filter) dilakukan dalam linear
   Terrain correction dilakukan dalam dB (tapi hasil akhir dikembalikan ke linear)
   Indeks dihitung dalam bentuk linear
   Untuk visualisasi biasanya dalam dB
 */
 
// Remove Border Noise citra == input data dB
function rem_bdr_noise(img) { 
    var edge = img.lt(-35); // Threshold dalam dB
    var properties = img.propertyNames();
    var maskedImage = img.mask().and(edge.not());
    return img.updateMask(maskedImage).copyProperties(img, properties);
}

// Koreksi insiden angle/Terrain correction (flattening) == input data dB
function inc_angle(img) {
  var gamma0 = img.expression(
    'i - 10 * log10(cos(angle * pi / 180))', {
    i: img.select(['VV', 'VH']),
    angle: img.select('angle'),
    pi: Math.PI
  }
  ).toFloat();
  return img.addBands(gamma0, null, true);  
}

// Koreksi geometrik despeckle dengan Median Filter == input data dB
function kor_desp(img) {
  var properties = img.propertyNames();
  return img.focalMedian(5).copyProperties(img, properties);
}

// Hitung indeks turunan setelah konversi dB ke linier
function cal_indices(img) {
    // Konversi dari dB ke linear
    var VV = img.select('VV').toFloat();
    var VH = img.select('VH').toFloat();
    
    var vv_int = VV.expression('10**(vv / 10)', {vv: VV}).rename('VV_int').toFloat();
    var vh_int = VH.expression('10**(vh / 10)', {vh: VH}).rename('VH_int').toFloat();

    // Hitung indeks menggunakan data linear
    var RPI = vh_int.divide(vv_int).rename('RPI').toFloat();
    var API = vv_int.add(vh_int).divide(2).rename('API').toFloat();
    var NDPI = vv_int.subtract(vh_int).divide(vv_int.add(vh_int)).rename('NDPI').toFloat();
    var RVI = vh_int.multiply(4).divide(vv_int.add(vh_int)).rename('RVI').toFloat();
    
    // Kembalikan semua band dalam linear
    return ee.Image.cat([
        vv_int, 
        vh_int,          
        img.select('angle'),  // Tetap original
        RPI, API, NDPI, RVI   
    ]).copyProperties(img, img.propertyNames()); 
}
 
//---------------------------------------------------------------------------//
// PREPROCESSING SENTINEL-1
//---------------------------------------------------------------------------//

exports.S1_preprocessing = function(param) { 
    var s1_col = ee.ImageCollection('COPERNICUS/S1_GRD') 
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) 
        .filterDate(param.start, param.end)
        .filterBounds(AOI.first().geometry());
        
      //apply image correction untuk ARD
    s1_col = s1_col
        .map(rem_bdr_noise)
        .map(inc_angle)
        .map(kor_desp)
        .map(cal_indices);
  return s1_col;      
};

//---------------------------------------------------------------------------//
// PEMROSESAN DASARIAN
//---------------------------------------------------------------------------//
 
var years = [2024];
var months = ee.List.sequence(1, 12);

// List untuk menyimpan koleksi dasarian
var dasarian_collection = [];
var dasarian_label = [];

// Looping tahun & bulan untuk membuat dasarian
years.forEach(function(year) {
    months.getInfo().forEach(function(month) {
        var monthStr = month < 10 ? "0" + month : month;
       
        // Dasarian 1: Tanggal 1 - 10
        var start1 = year + "-" + monthStr + "-01T00:01";
        var end1 = year + "-" + monthStr + "-10T23:59";
        
        // Dasarian 2: Tanggal 11 - 20
        var start2 = year + "-" + monthStr + "-11T00:01";
        var end2 = year + "-" + monthStr + "-20T23:59";
        
        // Dasarian 3: Tanggal 21 - Akhir bulan
        var lastDay = ee.Date.fromYMD(year, month, 1).advance(1, 'month').advance(-1, 'day').get('day').getInfo();
        var start3 = year + "-" + monthStr + "-21T00:01";
        var end3 = year + "-" + monthStr + "-" + lastDay + "T23:59";
        
        var dasarians = [
          {start: start1, end: end1, label: year + "-" + monthStr + " Dasarian-1"},
          {start: start2, end: end2, label: year + "-" + monthStr + " Dasarian-2"},
          {start: start3, end: end3, label: year + "-" + monthStr + " Dasarian-3"}
        ];
        
        // Proses Sentinel-1 untuk setiap dasarian 
        dasarians.forEach(function(period) {
            var processedImage = exports.S1_preprocessing({start: period.start, end: period.end});
        
            // Hitung jumlah citra dalam periode dasarian
            var imageCount = processedImage.size();
            
            // konversi band ke unsigned int16
            var mosaic = processedImage.median(); //qualityMosaic('RPI');
            var scaledImage = mosaic.select(["RPI", "VV_int", "VH_int", "API", "NDPI", "RVI"]).multiply(1000).toUint16()
                            .addBands(mosaic.select("angle").multiply(100).toUint16());
            
            var finalImage = scaledImage.clip(AOI).set({
                'system:time_start': ee.Date(period.start).millis(),
                'system:time_end': ee.Date(period.end).advance(1, 'day').millis(),
                'dasarian': period.label,
                'year': year,
                'month': month,
                'image_count':imageCount,
                'scale_VV_int' : 1000,
                'scale_VH_int': 1000,
                'scale_angle': 100,
                // 'Yr2K' :
            });
            
            dasarian_collection.push(finalImage);
            dasarian_label.push(period.label);
            
            Export.image.toAsset({
              image: finalImage,
              description: 'Sentinel1_' + period.label.replace(" ", "_"),
              assetId: 'projects/ee-bayuardianto104/assets/Dasarian_kab_Indramayu_2024/Sentinel1_' + period.label.replace(" ", "_"),
              scale: 30,
              region: AOI,
              maxPixels: 1e13
            });
        });
    });
});

// Gabungkan semua mosaic dasarian menjadi koleksi akhir
var final_dasarian_collection = ee.ImageCollection(dasarian_collection);
print('Final Sentinel-1 Dasarian Collection:', final_dasarian_collection);

//---------------------------------------------------------------------------//
// UI untuk visualisasi tiap Dasarian di Map.addLayer
//---------------------------------------------------------------------------//

var select_dasarian = ui.Select({
  items: dasarian_label,
  placeholder: 'Pilih Dasarian...',
  onChange: function(selected_label) {
    Map.layers().reset();
    var selected_image = final_dasarian_collection.filter(ee.Filter.eq('dasarian', selected_label)).first();
    Map.addLayer(selected_image, {min:[0.043,0.002,1.65],max:[0.273,0.064,8.135]}, selected_label);
  }
});

var panel = ui.Panel({
  widgets: [ui.Label('Pilih Periode Dasarian'), select_dasarian],
  style: {position: 'top-right', padding: '8px'}
});

Map.add(panel);
