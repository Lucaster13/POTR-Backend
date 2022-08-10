import TRAIT_DATA from './traits.json' assert { type: "json" };
const TRAIT_NAMES = ["Background", "Class", "Head", "Body", "Eyes", "Mouth", "Back"]
const COMMON_TRAIT_NAMES = [ "Body", "Head","Eyes", "Mouth", "Back"]


// POTR TRAIT_DATA MAPPINGS
const RARE_BACKGROUND = [
    'Gold',
    'POTR',
];
const RARE_CLASS = [
    'Phantom',
    'Archangel',
    'Golem',
    'Dragon',
];

const RARE_BODY = [
    'Flame',
    'Frost',
    'God Armor',
    'Angel Light',
    'Radioactive',
];
const RARE_HEAD = [
    'Master Hood',
    'Gandalf',
    'Robinhood',
    'Santa',
    'Crown',
];
const RARE_EYES = [
    'VR',
    'Closed',
    '3D',
    'Thug Life',
];
export const RARE_TRAIT_MAPPING = {
    Background: RARE_BACKGROUND,
    Class: RARE_CLASS,
    Body: RARE_BODY,
    Head: RARE_HEAD,
    Eyes: RARE_EYES,
};
export const getResolvedClass = (name) => (['Dragon', 'Golem', 'Phantom'].includes(name) ? name : 'Humanoid');

export function getTraitsFromCode(code) {
    const background = TRAIT_DATA.Background[0][Number(code.substr(0, 2))];
    const className = TRAIT_DATA.Class[0][Number(code.substr(2, 2))];
    const resolvedClass = getResolvedClass(className);
    console.log(resolvedClass)
    const traits = COMMON_TRAIT_NAMES.reduce((md, t, idx) =>{
        const traitIndex  = Number(code.substr((idx * 2) + 4, 2))
        console.log(t, md, traitIndex)
        return ({
        ...md, 
        [t]:TRAIT_DATA[t][resolvedClass][0][traitIndex]})},
    {
        Background: background,
        Class: className
    })

    return {
        ...traits,
        Power: getPower(traits)
    };
}

export function getTraitsFromStaticPath(path) {
    if (!path) {
        return {
            Background: 'N/A',
            Class: 'N/A',
            Body: 'N/A',
            Head: 'N/A',
            Eyes: 'N/A',
            Mouth: 'N/A',
            Back: 'N/A',
        };
    }
    const fName = path.split('/')[path.split('/').length-1];
    const code = fName.split('.')[0];
    return getTraitsFromCode(code);
}

function calcPower(traits, resolvedClass, type, weight){
    let rarity = null;
    if(!COMMON_TRAIT_NAMES.includes(type)){
        rarity = TRAIT_DATA[type][1][TRAIT_DATA[type][0].indexOf(traits[type])]
    }else{
        rarity = TRAIT_DATA[type][resolvedClass][1][TRAIT_DATA[type][resolvedClass][0].indexOf(traits[type])]
    }
    return weight / (rarity === 1 ? rarity :  Math.log(rarity));
}

export function getPower(traits){ 
    const resolvedClass = getResolvedClass(traits.Class);
    const isHumanoid = resolvedClass === "Humanoid" || resolvedClass === "Phantom"
    const isGolem = resolvedClass == "Golem"
    
    const weights = [
        100,
        600,
        400 * (isHumanoid ? 1 :2),
        300 * (isHumanoid ? 1 : isGolem ? 2.3 : 2), 
        200 * (isHumanoid ? 1 :1.6),
        120,
        70 * (isHumanoid ? 1 :isGolem ? 2:  1.6)
    ]
    
    const traitPowers = TRAIT_NAMES.map((t, idx) => calcPower(traits, resolvedClass, t, weights[idx]))
    const power = Math.round(traitPowers.reduce((tot, pow) => tot + pow, 0))
    
    return power
}
