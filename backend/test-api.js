import fetch from 'node-fetch';

async function testAPIEndpoint() {
  try {
    console.log('Testing API endpoint...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const url = `http://localhost:5006/api/presensi?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`;
    console.log('Testing URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Success:', data.success);
    console.log('Number of records:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n✅ API returned data:');
      console.table(data.data.map(item => ({
        id: item.id,
        id_warga: item.id_warga,
        namaWarga: item.namaWarga,
        status: item.status,
        tanggal: item.tanggal
      })));
    } else {
      console.log('❌ No data returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPIEndpoint();