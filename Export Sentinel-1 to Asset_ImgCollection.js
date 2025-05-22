//---------------------------------------------------------------------------//
// Folder Asset Image Disimpan 
//---------------------------------------------------------------------------//

// var folderPath = 'projects/ee-bayuardianto104/assets/Dasarian_Anjatan_2024_fix'; // ANJATAN
var folderPath = 'projects/ee-bayuardianto104/assets/Dasarian_kab_Indramayu_2024';

//---------------------------------------------------------------------------//
// Folder tujuan Image Collection 
//---------------------------------------------------------------------------//

// var collectionPath = 'projects/ee-bayuardianto104/assets/Dataset_S1-ARD_Anjatan_2024'; // ANJATAN
var collectionPath = 'projects/ee-bayuardianto104/assets/Dataset_S1_ARD_Indramayu_2024';

//---------------------------------------------------------------------------//
// Tahun dan bulan yang ingin diproses 
//---------------------------------------------------------------------------//

var years = [2024]; 
var months = ee.List.sequence(1, 12);
var dasarians = ['Dasarian-1', 'Dasarian-2', 'Dasarian-3'];

//---------------------------------------------------------------------------//
// Generate daftar nama aset berdasarkan tahun, bulan, dan dasarian 
//---------------------------------------------------------------------------//

var assetNames = [];
years.forEach(function(year) {
    months.getInfo().forEach(function(month) {
        var monthStr = month < 10 ? "0" + month : month; // Format bulan agar dua digit
        dasarians.forEach(function(dasarian) {
            var assetName = 'Sentinel1_' + year + '-' + monthStr + '_' + dasarian;
            assetNames.push(assetName);
        });
    });
});

//---------------------------------------------------------------------------//
// Print daftar nama asset 
//---------------------------------------------------------------------------//

print("Daftar Asset yang akan dipindahkan:", assetNames);

//---------------------------------------------------------------------------//
// Loop untuk menyalin semua image ke Image Collection 
//---------------------------------------------------------------------------//

assetNames.forEach(function(assetName) {
    var image = ee.Image(folderPath + '/' + assetName);
 
    Export.image.toAsset({
        image: image,
        description: assetName,
        assetId: collectionPath + '/' + assetName,
        scale: 10,
        region: image.geometry(),
        maxPixels: 1e13
    });
});

print('Proses ekspor dimulai. Cek tab "Tasks" untuk melihat status.');
