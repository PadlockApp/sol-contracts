const fetch = require('node-fetch');

function getCreations(lastId, creator) {
    batchSize = 1
    const query = `
    {
        creations(first: ${batchSize}, where: {id_gt: ${lastId}, creator: \"${creator}\"}) {
            id
            creator
            hash
            metadataHash
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
    const creator = "0x05b993fc742fdb87d179835e59d2272a3bc83cd1";
    let creations = await getCreations(lastId, creator);
    do {
        for (i = 0; i < creations.length; i++) {
            console.log(JSON.stringify(i));
            lastId = parseInt(i.id, 'hex')
        }
        creations = await getCreations(lastId, creator);
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
