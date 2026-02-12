import io
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove


async def process_photo(
    image_bytes: bytes,
    background: str = "blur",
    brightness: float = 1.1,
    contrast: float = 1.1,
    sharpness: float = 1.2,
) -> bytes:
    """
    Process and enhance a photo for professional use.

    Pipeline:
    1. Open image and apply enhancements (brightness, contrast, sharpness)
    2. Remove background using rembg
    3. Apply new background based on selection
    4. Return as JPEG bytes

    Args:
        image_bytes: Raw image file content.
        background: Background style (original, blur, office, solid).
        brightness: Brightness multiplier (1.0 = original).
        contrast: Contrast multiplier (1.0 = original).
        sharpness: Sharpness multiplier (1.0 = original).

    Returns:
        Enhanced image as JPEG bytes.
    """
    # Open original image
    original = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    # Resize if too large (max 2048px on longest side)
    max_dim = 2048
    if max(original.size) > max_dim:
        ratio = max_dim / max(original.size)
        new_size = (int(original.size[0] * ratio), int(original.size[1] * ratio))
        original = original.resize(new_size, Image.LANCZOS)

    # Step 1: Enhance the image
    rgb_image = original.convert("RGB")
    enhanced = ImageEnhance.Brightness(rgb_image).enhance(brightness)
    enhanced = ImageEnhance.Contrast(enhanced).enhance(contrast)
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(sharpness)

    if background == "original":
        # No background removal — just return enhanced image
        return _to_jpeg_bytes(enhanced)

    # Step 2: Remove background using rembg
    enhanced_rgba = enhanced.convert("RGBA")
    enhanced_bytes = io.BytesIO()
    enhanced_rgba.save(enhanced_bytes, format="PNG")
    enhanced_bytes.seek(0)

    fg_bytes = remove(enhanced_bytes.getvalue())
    foreground = Image.open(io.BytesIO(fg_bytes)).convert("RGBA")

    # Step 3: Create background
    bg = _create_background(
        background_style=background,
        size=foreground.size,
        original_rgb=rgb_image.resize(foreground.size, Image.LANCZOS),
    )

    # Step 4: Composite foreground onto background
    result = Image.alpha_composite(bg.convert("RGBA"), foreground)

    return _to_jpeg_bytes(result.convert("RGB"))


def _create_background(
    background_style: str,
    size: tuple[int, int],
    original_rgb: Image.Image,
) -> Image.Image:
    """Create a background image based on the selected style."""
    w, h = size

    if background_style == "blur":
        # Gaussian blur of the original image
        bg = original_rgb.filter(ImageFilter.GaussianBlur(radius=25))
        # Darken slightly
        bg = ImageEnhance.Brightness(bg).enhance(0.7)
        return bg

    if background_style == "office":
        # Neutral gray-blue gradient simulation
        bg = Image.new("RGB", size, (220, 225, 230))
        return bg

    if background_style == "solid":
        # Clean white background
        bg = Image.new("RGB", size, (245, 245, 245))
        return bg

    # Fallback
    return Image.new("RGB", size, (255, 255, 255))


def _to_jpeg_bytes(image: Image.Image) -> bytes:
    """Convert PIL Image to JPEG bytes."""
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90, optimize=True)
    return buffer.getvalue()
