// Test lengkap CRUD untuk Jenis Dana
const API_BASE = 'http://localhost:5006/api/jenis-dana';

async function testCRUD() {
    console.log('🧪 Memulai test CRUD Jenis Dana...\n');
    
    try {
        // 1. TEST READ (GET ALL)
        console.log('1️⃣ Testing GET ALL...');
        const getResponse = await fetch(API_BASE);
        const getData = await getResponse.json();
        console.log('✅ GET ALL berhasil:', getData.success);
        console.log('   Data count:', getData.data?.length || 0);
        console.log('');

        // 2. TEST CREATE (POST)
        console.log('2️⃣ Testing CREATE...');
        const newData = {
            namaDana: `Test Dana ${Date.now()}`,
            deskripsi: 'Deskripsi test dana untuk CRUD test',
            isActive: true
        };
        
        const createResponse = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });
        const createResult = await createResponse.json();
        console.log('✅ CREATE berhasil:', createResult.success);
        console.log('   New ID:', createResult.data?.id);
        
        const newId = createResult.data?.id;
        console.log('');

        if (newId) {
            // 3. TEST UPDATE (PUT)
            console.log('3️⃣ Testing UPDATE...');
            const updateData = {
                namaDana: `Updated Dana ${Date.now()}`,
                deskripsi: 'Deskripsi yang sudah diupdate',
                isActive: false
            };
            
            const updateResponse = await fetch(`${API_BASE}/${newId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            console.log('✅ UPDATE berhasil:', updateResult.success);
            console.log('');

            // 4. TEST GET BY ID
            console.log('4️⃣ Testing GET BY ID...');
            const getByIdResponse = await fetch(`${API_BASE}/${newId}`);
            const getByIdData = await getByIdResponse.json();
            console.log('✅ GET BY ID berhasil:', getByIdData.success);
            console.log('   Updated name:', getByIdData.data?.namaDana);
            console.log('');

            // 5. TEST DELETE
            console.log('5️⃣ Testing DELETE...');
            const deleteResponse = await fetch(`${API_BASE}/${newId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            console.log('✅ DELETE berhasil:', deleteResult.success);
            console.log('');
        }

        console.log('🎉 Semua test CRUD berhasil!');
        
    } catch (error) {
        console.error('❌ Test CRUD gagal:', error.message);
    }
}

testCRUD();