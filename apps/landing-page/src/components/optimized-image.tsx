import {
  type ImgHTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useInView } from "../lib/use-in-view";

const IMG_PATH = "/images/gen";

const DEFAULT_SIZES =
  "(max-width: 450px) 450px, (max-width: 700px) 690px, (max-width: 1020px) 900px, 1536px";

const WIDTHS = [450, 690, 900, 1536];

const IMAGE_EXT_RE = /\.(png|jpg|jpeg|webp|avif)$/i;

const STYLE_SUFFIX_RE = /-(?:watercolor)$/i;

function generateSrcSet(baseName: string, ext: string): string {
  return WIDTHS.map((w) => `${IMG_PATH}/${baseName}-${w}w.${ext} ${w}w`).join(
    ", "
  );
}

function pickBaseName(src: string): string {
  const name: string =
    src
      .split("/")
      .pop()
      ?.replace(IMAGE_EXT_RE, "")
      .replace(STYLE_SUFFIX_RE, "") ?? "suwa-hero";
  return name;
}

function getBlurUrl(_src: string): string {
  return `${IMG_PATH}/blur.txt`;
}

export interface OptimizedImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "srcSet" | "onLoad"
  > {
  alt: string;
  baseName?: string;
  blurDataURL?: string;
  formats?: Array<"avif" | "webp" | "png">;
  height: number;
  priority?: boolean;
  sizes?: string;
  src: string;
  width: number;
}

export function OptimizedImage(props: OptimizedImageProps) {
  const {
    src,
    baseName = pickBaseName(src),
    alt,
    width,
    height,
    sizes = DEFAULT_SIZES,
    formats = ["avif", "webp", "png"],
    blurDataURL,
    priority = false,
    className = "",
    style,
  } = props;
  const [loaded, setLoaded] = useState(priority);
  const [blur, setBlur] = useState(blurDataURL);
  const [containerRef, inView] = useInView<HTMLDivElement>({
    rootMargin: "200px",
  });
  const shouldLoad = priority || inView;

  const onLoad = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!blur && shouldLoad) {
      fetch(getBlurUrl(src))
        .then((r) => r.text())
        .then((b64) => setBlur(b64))
        .catch(() => undefined);
    }
  }, [blur, shouldLoad, src]);

  return (
    <div
      className={`relative size-full ${className}`}
      ref={containerRef}
      style={{ width: "100%", ...style }}
    >
      {blur && !loaded ? (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-105 object-cover blur-sm"
          height={height}
          loading="lazy"
          src={blur}
          width={width}
        />
      ) : null}
      {shouldLoad ? (
        <picture className="block size-full">
          {formats.map((fmt) => (
            <source
              key={fmt}
              sizes={sizes}
              srcSet={generateSrcSet(baseName, fmt)}
              type={`image/${fmt}`}
            />
          ))}
          <img
            alt={alt}
            className={`block size-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            decoding="async"
            height={height}
            loading={priority ? "eager" : "lazy"}
            onLoad={onLoad}
            src={`${IMG_PATH}/${baseName}-1536w.png`}
            width={width}
          />
        </picture>
      ) : null}
    </div>
  );
}

export interface OptimizedPictureProps
  extends Omit<OptimizedImageProps, "blurDataURL"> {
  className?: string;
  style?: React.CSSProperties;
}

export function OptimizedPicture(props: OptimizedPictureProps) {
  const {
    src,
    baseName = pickBaseName(src),
    alt,
    width,
    height,
    sizes = DEFAULT_SIZES,
    formats = ["avif", "webp", "png"],
    priority = false,
    className = "",
    style,
  } = props;
  const [loaded, setLoaded] = useState(priority);
  const [containerRef, inView] = useInView<HTMLDivElement>({
    rootMargin: "200px",
  });
  const shouldLoad = priority || inView;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      ref={containerRef}
      style={{ width: "100%", aspectRatio: `${width} / ${height}`, ...style }}
    >
      {shouldLoad ? (
        <picture className="block size-full">
          {formats.map((fmt) => (
            <source
              key={fmt}
              sizes={sizes}
              srcSet={generateSrcSet(baseName, fmt)}
              type={`image/${fmt}`}
            />
          ))}
          <img
            alt={alt}
            className={`block size-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            decoding="async"
            height={height}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setLoaded(true)}
            src={`${IMG_PATH}/${baseName}-1536w.png`}
            width={width}
          />
        </picture>
      ) : null}
    </div>
  );
}
