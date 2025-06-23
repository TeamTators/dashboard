export const POST = async (event) => {
    console.log('POST request received at /');
    console.log('Request body:', await event.request.text());
    
    return new Response('POST request received', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}