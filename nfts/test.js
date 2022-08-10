
import { getTraitsFromStaticPath } from "./traits.js";
const files = [
    "00000000000000.png","00020010100200.png","00051002020003.png","00060015030000.png","01040405090002.png",
    "01041002000100.png","02080101010301.png","03020011050000.png","03030005010000.png","03070000030400.png","04000013020000.png",
    "04020815010000.png","05030106000000.png","06070400000000.png","07030009000002.png","08001000010000.png","09010601010000.png",
    "09070000040100.png"
]


const traits = files.map(getTraitsFromStaticPath);

const metadata = traits.map((t, idx) => {
    const idNum = Math.round(Math.random() * 4000);
    return {name: `Protector ${idNum}`, symbol: `POTR${idNum}`, url: files[idx], properties: t}
})

console.log(metadata)