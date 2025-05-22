// Mengubah koleksi gambar Sentinel-1 menjadi format float
var jumlah_img, list_img, list_tgl;

// Mengonversi nilai dari integer ke float menggunakan fungsi konversi
var dataset_S1 = S1_col.map(int_to_float);

// Mendapatkan jumlah gambar dalam koleksi
jumlah_img = dataset_S1.size().getInfo();

// Mengubah koleksi gambar menjadi daftar
list_img = dataset_S1.toList(jumlah_img);

// Mengekstrak tanggal dari setiap gambar dalam koleksi
list_tgl = list_img.map(function(img){
  var img_ee = ee.Image(img);
  return img_ee.date().format("YYYY-MM-dd");
}).getInfo();

// Menampilkan informasi jumlah gambar
print("Jumlah gambar Sentinel-1 = " + jumlah_img, dataset_S1);

// Parameter visualisasi
var parameterVisualisasi = { 
  min: [0.043, 0.002, 1.65], 
  max: [0.273, 0.064, 8.135] 
};

// // Parameter visualisasi
// var parameterVisualisasi = { 
//   min: [0.017, 0.002, 2.944], 
//   max: [0.298, 0.065, 20.5] 
// };

// Memusatkan peta pada area studi
Map.centerObject(dataset_S1, 10);

// Fungsi untuk mengonversi data integer ke float
function int_to_float(img){
  var vh = img.select("VH_int").divide(1000).toFloat();
  var vv = img.select("VV_int").divide(1000).toFloat();
  var rpi = img.select("RPI").divide(1000).toFloat();
  var api = img.select("API").divide(1000).toFloat();
  var ndpi = img.select("NDPI").divide(1000).toFloat();  
  var rvi = img.select("RVI").divide(1000).toFloat();
  var angle = img.select("angle").divide(100).toFloat();
  // var rpi2 = ee.Image(1).divide(rpi).toFloat().rename("RPI2");
  var rpi2 = (vv).divide(vh).toFloat().rename("RPI2");
  var final_image = ee.Image.cat(vv, vh, rpi2, rpi, angle);
  return img.addBands(final_image, null, true)
    .select("VV_int", "VH_int", "RPI2", "RPI", "API", "NDPI", "RVI", "angle");
}

// Membuat UI Panel untuk memilih gambar berdasarkan tanggal
var selectPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    position: 'top-left',  
    padding: '8px',
    backgroundColor: 'white',
    border: '1px solid black'
  }
});

var selectLabel = ui.Label('Pilih periode daarian:');
var selectDropdown = ui.Select({
  items: list_tgl,
  placeholder: 'Pilih tanggal',
  onChange: function(selectedDate) {
    var selectedIndex = list_tgl.indexOf(selectedDate);
    var selectedImage = ee.Image(list_img.get(selectedIndex));

    // Menghapus semua layer sebelumnya sebelum menampilkan yang baru
    Map.layers().reset();

    // Menampilkan gambar utama dengan parameter visualisasi
    Map.addLayer(selectedImage, parameterVisualisasi, 'Sentinel-1: ' + selectedDate);
    
    // Menampilkan layer tambahan
    Map.addLayer(selectedImage.select("VV_int"), {min: 0.029, max: 0.326, palette: ['red', 'yellow', 'green']}, "VV " + selectedDate, false); 
    Map.addLayer(selectedImage.select("VH_int"), {min: 0.018, max: 0.047, palette: ['red', 'yellow', 'green']}, "VH " + selectedDate, false);  
    Map.addLayer(selectedImage.select("RPI"), {min: 0.005, max: 0.275, palette: ['red', 'yellow', 'green']}, "RPI " + selectedDate, false);  
    Map.addLayer(selectedImage.select("API"), {min: 36.588, max: 114.1001, palette: ['red', 'yellow', 'green']}, "API " + selectedDate, false);  
    Map.addLayer(selectedImage.select("NDPI"), {min: 561.967, max: 953.223, palette: ['red', 'yellow', 'green']}, "NDPI " + selectedDate, false);  
    Map.addLayer(selectedImage.select("RVI"), {min: 93.438, max: 874.871, palette: ['red', 'yellow', 'green']}, "RVI " + selectedDate, false);

  }
});

// Menambahkan panel ke UI
selectPanel.add(selectLabel).add(selectDropdown);
ui.root.add(selectPanel);

/////////////////////
// Membuat ImageCollection dari daftar gambar yang telah diproses
var collection_result = ee.ImageCollection(
  list_tgl.map(function(date){
    var index = list_tgl.indexOf(date);
    var img = ee.Image(list_img.get(index))
      .set('system:time_start', ee.Date(date).millis()); 
    return img;
  })
);

// Menampilkan koleksi di peta sebagai time series
var visParams = {
  min: [0.043, 0.002, 1.65], 
  max: [0.273, 0.064, 8.135], 
  bands: ["VV_int", "VH_int", "RPI2"]
};

// Menampilkan koleksi di peta dengan visualisasi
Map.addLayer(collection_result, visParams, "Time Series Sentinel-1");

// Menampilkan grafik time series di Inspector
var chart = ui.Chart.image.series({
  imageCollection: collection_result,
  region: S1_col,  
  reducer: ee.Reducer.median(),
  scale: 30,
  xProperty: 'system:time_start'
}).setOptions({
  title: "Time Series Sentinel-1",
  hAxis: { title: "Tanggal" },
  vAxis: { title: "Nilai Reflektan" },
  lineWidth: 2,
  pointSize: 4
});
print(chart);
