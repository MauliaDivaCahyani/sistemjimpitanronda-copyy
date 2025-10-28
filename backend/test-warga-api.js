// Test script untuk debug error API warga
import fetch from 'node-fetch';

const testData = [
  // Test dengan data valid
  {
    namaLengkap: "Test Warga 1",
    jenisKelamin: "Laki-laki",
    statusAktif: "Aktif"
  },
  // Test dengan data tidak lengkap (harus gagal)
  {
    namaLengkap: "",
    jenisKelamin: "Laki-laki",
    statusAktif: "Aktif"
  },
  // Test dengan jenis kelamin kosong (harus gagal)
  {
    namaLengkap: "Test Warga 3",
    jenisKelamin: "",
    statusAktif: "Aktif"
  }
];

async function testWargaAPI() {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    console.log(`\n=== Test ${i + 1} ===`);
    console.log("Data:", data);
    
    try {
      const response = await fetch('http://localhost:5006/api/warga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log("Status:", response.status);
      console.log("Response:", result);
      
      if (!response.ok) {
        console.log("❌ GAGAL:", result.message);
      } else {
        console.log("✅ BERHASIL:", result.message);
      }
    } catch (error) {
      console.log("🔥 ERROR:", error.message);
    }
  }
}

testWargaAPI();