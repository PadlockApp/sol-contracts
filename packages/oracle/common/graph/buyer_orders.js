const fetch = require('node-fetch');

function getBuyerOrders(lastId, buyer) {
    batchSize = 1
    const query = `
    {
        creations(first: ${batchSize}) {
            id
            creator
            hash
            metadataHash
        }
        orders(first: 5, where: {id_gt: ${lastId}, buyer: \"${buyer}\"}) {
            id
            recipient
        }
    }`;


    let response = fetch('https://api.thegraph.com/subgraphs/name/padlockapp/padlock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
        })
        }).then(r => r.json()).then(data => {
            console.log('data returned:', JSON.stringify(data))
            return data;
            });
    return response;
}

async function main() {
    let lastId = 0;
    const buyer = "0xc783df8a850f42e7f7e57013759c285caa701eb6";
    let creations = await getBuyerOrders(lastId, buyer);
    do {
        for (i = 0; i < creations.length; i++) {
            console.log(JSON.stringify(i));
            lastId = parseInt(i.id, 'hex')
        }
        creations = await getBuyerOrders(lastId, buyer);
    } while (creations.length > 0);
}

main().then(
  () => {
    console.info("Fetched creations.");
    process.exit(0);
  },
  error => {
    console.error(error);
    process.exit(1);
  },
);
