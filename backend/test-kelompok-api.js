import fetch from 'node-fetch';

async function testKelompokRondaAPI() {
  try {
    console.log('Testing Kelompok Ronda Info API...');
    
    const url = 'http://localhost:5006/api/warga-ronda/info';
    console.log('Testing URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Success:', data.success);
    
    if (data.success) {
      console.log('\n✅ Today Groups:', data.data.today.groups.length);
      console.log('Today Members:', data.data.today.members.length);
      
      console.log('\n✅ Today Groups Data:');
      console.table(data.data.today.groups);
      
      if (data.data.today.members.length > 0) {
        console.log('\n✅ Today Members Data (first 5):');
        console.table(data.data.today.members.slice(0, 5));
      }
    } else {
      console.log('❌ API Error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testKelompokRondaAPI();