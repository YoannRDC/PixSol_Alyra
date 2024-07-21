from PIL import Image, ImageDraw, ImageFont
import os

# Chemin vers l'image source
source_image_path = "PixSol_logo.png"
output_folder = "PixSol_images"

# Créer le dossier de sortie s'il n'existe pas
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Charger l'image source
source_image = Image.open(source_image_path)

# Définir la police et la taille de police
# Assurez-vous que le fichier de police (par exemple, Arial.ttf) est dans le même dossier ou spécifiez le chemin complet
font_path = "arial.ttf"
font_size = 144  # Taille de la police multipliée par 4 (36 * 4 = 144)
font = ImageFont.truetype(font_path, font_size)

# Ajouter le numéro à chaque image et l'enregistrer
for i in range(1, 101):
    img = source_image.copy()
    draw = ImageDraw.Draw(img)
    text = str(i)
    # Utiliser textbbox pour obtenir la taille du texte
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width, text_height = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
    
    # Positionner le texte en bas à droite de l'image
    width, height = img.size
    x = width - text_width - 40  # 10 pixels de marge
    y = height - text_height - 50  # 10 pixels de marge
    
    draw.text((x, y), text, font=font, fill="black")
    img.save(os.path.join(output_folder, f"pixel_{i}.png"))

print("Images générées avec succès !")
