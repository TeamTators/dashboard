import { openStructs } from "../cli/struct";



const main = async () => {
    const structs = (await openStructs()).unwrap();
};

main();