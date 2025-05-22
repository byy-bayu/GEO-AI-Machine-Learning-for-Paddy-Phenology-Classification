/**---------------------------------------------------------------------------
Folder Asset Image Disimpan 
---------------------------------------------------------------------------**/

var folderPath = 'projects/ee-bayuardianto104/assets/Dasarian_kab_Indramayu_2024';
// var folderPath = 'projects/ee-bayuardianto104/assets/Dataset_S1-ARD_Anjatan_2024';

/**---------------------------------------------------------------------------
Folder tujuan di Google Drive == sesuaikan dengan folder yang ingin dituju
---------------------------------------------------------------------------**/

var driveFolder = 'Research/Sentinel-1/Dataset_S1-ARD_Indramayu_2024';

/**---------------------------------------------------------------------------
Tahun dan bulan yang ingin diproses 
---------------------------------------------------------------------------**/

var years = [2024]; 
var months = ee.List.sequence(1, 12);
var dasarians = ['Dasarian-1', 'Dasarian-2', 'Dasarian-3'];

/**---------------------------------------------------------------------------
Generate daftar nama aset berdasarkan tahun, bulan, dan dasarian
---------------------------------------------------------------------------**/

var assetNames = [];
years.forEach(function(year) {
    months.getInfo().forEach(function(month) {
        var monthStr = month < 10 ? "0" + month : month;
        dasarians.forEach(function(dasarian) {
            assetNames.push('Sentinel1_' + year + '-' + monthStr + '_' + dasarian);
        });
    });
});

/**---------------------------------------------------------------------------
Print daftar nama asset
---------------------------------------------------------------------------**/

print("Daftar Asset yang akan diekspor ke Google Drive:", assetNames);

    
/**---------------------------------------------------------------------------
Loop untuk mengekspor semua image ke Google Drive 
---------------------------------------------------------------------------**/

assetNames.forEach(function(assetName) {
    var image = ee.Image(folderPath + '/' + assetName);
    
    // Konversi citra dari uint16 ke float32 dengan membagi 1000
    var imageFloat = image.divide(1000).toFloat();

    Export.image.toDrive({
        image: imageFloat,
        description: assetName + '_float',
        folder: driveFolder,
        fileNamePrefix: assetName + '_float',
        scale: 10,
        region: image.geometry(),
        maxPixels: 1e13,
        fileFormat: 'GeoTIFF'
    });
});

print('Proses ekspor dimulai. Cek tab "Tasks" untuk status.');
