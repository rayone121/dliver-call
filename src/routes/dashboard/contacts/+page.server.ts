import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { pb, user } = locals;
  
  // Protect this route - only authenticated users can access it
  if (!user) {
    throw redirect(303, "/login");
  }
  
  let clients: any = [];
  
  try {
    // Fetch all clients from PocketBase
    const records = await pb.collection('clients').getFullList({
      sort: 'name',
    });
    
    clients = records.map(record => ({
      id: record.id,
      name: record.name || '',
      vat: record.vat || '',
      phone: record.phone || '',
      email: record.email || ''
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
  }
  
  return {
    user,
    clients
  };
};

export const actions: Actions = {
  logCall: async ({ locals, request }) => {
    const { pb, user } = locals;

    if (!user) {
      throw redirect(303, "/login");
    }

    const formData = await request.formData();
    const clientName = formData.get('clientName')?.toString();
    const phoneNumber = formData.get('phoneNumber')?.toString();

    if (!clientName || !phoneNumber) {
      return fail(400, {
        success: false,
        message: "Client name and phone number are required"
      });
    }

    try {
      console.log('Contacts - Creating call log with data:', {
        user: user.id,
        clientName,
        phoneNumber
      });

      // Find existing client by phone number (and name if not Manual Dial)
      let clientRecord;
      
      // Normalize phone number for comparison (remove +, 0 prefix, spaces, dashes)
      function normalizePhone(phone: string): string {
        return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
      }
      
      const normalizedInputPhone = normalizePhone(phoneNumber);
      console.log('Contacts - Normalized input phone:', normalizedInputPhone);
      
      try {
        let clients;
        
        if (clientName === 'Manual Dial') {
          // For manual dial, search all clients by phone number only
          console.log('Contacts - Manual dial - searching all clients by phone');
          clients = await pb.collection('clients').getFullList();
        } else {
          // For contact calls, search by name first
          console.log('Contacts - Contact call - searching by name:', clientName);
          clients = await pb.collection('clients').getFullList({
            filter: `name="${clientName}"`
          });
        }
        
        console.log('Contacts - Found clients to check:', clients.length);
        
        // Find client with matching phone using substring matching
        clientRecord = clients.find(client => {
          const normalizedClientPhone = normalizePhone(client.phone || '');
          console.log('Contacts - Comparing:', normalizedInputPhone, 'vs', normalizedClientPhone, 'for client:', client.name);
          
          // Check if either phone contains the other (for cases like 0774463442 vs 40774463442)
          const phoneMatch = normalizedInputPhone.includes(normalizedClientPhone) || 
                           normalizedClientPhone.includes(normalizedInputPhone) ||
                           normalizedInputPhone === normalizedClientPhone;
          
          if (phoneMatch) {
            console.log('Contacts - Phone match found for client:', client.name);
          }
          
          return phoneMatch;
        });
        
        if (!clientRecord) {
          throw new Error('No matching client found');
        }
        
        console.log('Contacts - Found existing client:', clientRecord.id, clientRecord.name);
      } catch (error: any) {
        console.log('Contacts - Client not found in database:', error.message);
        return fail(400, {
          success: false,
          message: "Client not found. Please add the client to your contacts first."
        });
      }
      
      const record = await pb.collection('call_logs').create({
        user: user.id,
        client_name: clientRecord.id,
        status: 'Initiated'
      });
      
      console.log('Contacts - Call log created successfully:', record.id);
      
      return {
        success: true,
        message: "Call logged successfully"
      };
    } catch (error) {
      console.error('Contacts - Error logging call:', error);
      console.error('Contacts - Error details:', error);
      return fail(500, {
        success: false,
        message: `Error logging call: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
};