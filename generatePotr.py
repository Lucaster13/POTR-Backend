import json
import random
from functools import reduce
from math import log

from IPython.display import display
from PIL import Image

TRAITS_DATA = None
TRAITS_NAMES = ["Background","Class", "Body", "Head", "Eyes", "Mouth", "Back"]
COMMON_TRAITS = TRAITS_NAMES[2:]


with open("./nfts/traits.json", "r") as rf:
    TRAITS_DATA = json.load(rf)

asset_path = "/Users/lucasterr/Documents/potr/traits/assets"
none_path = "/Users/lucasterr/Documents/potr/traits/assets/none.png"

def get_bg_path(bg_name): 
    return f"{asset_path}/background/{bg_name.lower()}.png"
def get_class_path(class_name): 
    return f"{asset_path}/humanoid/class/{class_name.lower()}.png" if class_name not in ["Dragon", "Golem"] else None;
def get_asset_path(traits, trait_type):
    if traits[trait_type] == "None": return none_path
    formatted_trait = traits[trait_type].replace(" ", "_").lower()
    class_path = traits['Class'].lower() if traits["Class"] in ["Dragon", "Golem"] else "Humanoid"
    return f"{asset_path}/{class_path}/{trait_type.lower()}/{formatted_trait}.png"
def get_resolved_class(class_name):
    return class_name if class_name in ["Dragon", "Golem", "Phantom"] else "Humanoid"
def generate_file_name(traits):
    background_idx = TRAITS_DATA["Background"][0].index(traits["Background"])
    class_idx = TRAITS_DATA["Class"][0].index(traits["Class"])
    resolved_class_name = get_resolved_class(traits["Class"])
    common_trait_idxs = map(lambda trait: TRAITS_DATA[trait][resolved_class_name][0].index(traits[trait]), COMMON_TRAITS)
    path_name = f"{background_idx:02d}{class_idx:02d}"
    for idx in common_trait_idxs:
        path_name = path_name + f"{idx:02d}"
    return path_name
def get_random_trait(type, class_name = None): 
    if(type in TRAITS_NAMES[:2]):
        return random.choices(TRAITS_DATA[type][0], TRAITS_DATA[type][1])[0]
    resolved_class = get_resolved_class(class_name)
    return random.choices(
        TRAITS_DATA[type][resolved_class][0],
        TRAITS_DATA[type][resolved_class][1]
    )[0]
def get_power(traits):
    resolved_class = get_resolved_class(traits["Class"]);
    is_humanoid = resolved_class == "Humanoid" or resolved_class == "Phantom"
    is_golem = resolved_class == "Golem"
    
    trait_weights = [
        100,
        600,
        400 * (1 if is_humanoid else 2),
        300 * (1 if is_humanoid else 2.3 if is_golem else 2), 
        200 * (1 if is_humanoid else 1.6),
        120,
        70 * (1 if is_humanoid else 2 if is_golem else 1.6)
    ]
    
    def calc_power(type, weight):
        rarity = None;
        if(type in TRAITS_NAMES[:2]): 
            rarity = TRAITS_DATA[type][1][TRAITS_DATA[type][0].index(traits[type])]
        else: 
            rarity = TRAITS_DATA[type][resolved_class][1][TRAITS_DATA[type][resolved_class][0].index(traits[type])]
    
        return weight /( 1 if rarity == 1 else log(rarity))
    
    trait_powers = [calc_power(type, weight) for type, weight in zip(TRAITS_NAMES, trait_weights)]
    power = round(reduce(lambda curr, tot: curr + tot, trait_powers))
    
    return power
def generate_metadata(n = 200):
    metadata = []
    
    for i in range(n):
        new_background = get_random_trait("Background")
        new_class = get_random_trait("Class")
        new_body = get_random_trait("Body", new_class)
        new_head = get_random_trait("Head",new_class)
        new_eyes = get_random_trait("Eyes",new_class)
        new_mouth = get_random_trait("Mouth",new_class)
        new_back = get_random_trait("Back",new_class)
        
        new_potr_metadata = {
            "Background": new_background,
            "Class": new_class,
            "Body": new_body,
            "Head": new_head,
            "Eyes": new_eyes,
            "Mouth": new_mouth,
            "Back": new_back
        }
        
        # loop again if these traits exist
        if(new_potr_metadata in metadata):
            i -= 1
            continue;
        else:
            power = get_power(new_potr_metadata)
            new_potr_metadata["Power"] = power
            metadata.append(new_potr_metadata)
    
    return metadata
# n = # of nfts to make
potr_traits = generate_metadata(n = 10)

print(json.dumps(potr_traits))
    
    
    
    
def generate_layers(traits):
    layers = {
        "Background": Image.open(get_bg_path(traits["Background"])).convert('RGBA'),
        "Body": Image.open(get_asset_path(traits, "Body")).convert('RGBA'),
        "Head": Image.open(get_asset_path(traits, "Head")).convert('RGBA'),
        "Eyes": Image.open(get_asset_path(traits, "Eyes")).convert('RGBA'),
        "Mouth": Image.open(get_asset_path(traits, "Mouth")).convert('RGBA'),
        "Back": Image.open(get_asset_path(traits, "Back")).convert('RGBA'),
    }
    return layers
def generate_dragon_layers(traits):
    back_trait = traits["Body"] if traits["Back"] == "Dragon Wings" else traits["Back"]
    traits["Back"] = back_trait
    layers = generate_layers(traits)   
    layers["Class"] = Image.open(none_path).convert('RGBA')
    if(traits["Back"] not in TRAITS_DATA["Back"]["Dragon"][0]): traits["Back"] = "Dragon Wings"
    return layers
def generate_golem_layers(traits):
    layers = generate_layers(traits)   
    layers["Class"] = Image.open(none_path).convert('RGBA')
    return layers
def generate_humanoid_layers(traits):
    layers = generate_layers(traits)
    layers["Class"] = Image.open(get_class_path(traits["Class"])).convert('RGBA')
    return layers
def create_image_composite(traits, layers):
    trait_types = TRAITS_NAMES.copy()
    if(traits["Class"] in ["Dragon", "Golem"]): trait_types.remove("Class")
    potr = Image.alpha_composite(layers[trait_types[0]], layers[trait_types[1]]);
    for type in trait_types[2:]:
        potr = Image.alpha_composite(potr, layers[type])
    
    potr = potr.convert('RGB')
    return potr


file_names = []

for traits in potr_traits:
    class_name = traits["Class"]
    
    layers = None;
    if(class_name == "Dragon"):
        layers = generate_dragon_layers(traits)
    elif(class_name == "Golem"):
        layers = generate_golem_layers(traits)
    else:
        layers = generate_humanoid_layers(traits)

    # create composite images
    potr = create_image_composite(traits, layers)

    #Convert to RGB
    potr_name = generate_file_name(traits)
    file_name = f"./nfts/images/{potr_name}.png"
    file_names.append(file_name)
    potr.save(file_name)


print(json.dumps(file_names))
