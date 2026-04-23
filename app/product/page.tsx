"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";

type Axis = {
  label: "X" | "Y";
  min: number;
  max: number;
};

type ProductResult = {
  id: string;
  status: "successed" | "failed";
  statusText: string;
  code: string;
  codeColor: string;
  confidence: number;
  axes: Axis[];
};

const productResults: ProductResult[] = [
  {
    id: "1",
    status: "successed",
    statusText: "Success",
    code: "QFP CHIP 41-01",
    codeColor: "#508A42",
    confidence: 87,
    axes: [
      { label: "X", min: 230, max: 245 },
      { label: "Y", min: 144, max: 258 },
    ],
  },
  {
    id: "2",
    status: "failed",
    statusText: "Failed",
    code: "QFN 22-02",
    codeColor: "#C23E31",
    confidence: 63,
    axes: [
      { label: "X", min: 100, max: 120 },
      { label: "Y", min: 80, max: 110 },
    ],
  },
  {
    id: "3",
    status: "successed",
    statusText: "Success",
    code: "QFP CHIP 41-03",
    codeColor: "#E78635",
    confidence: 81,
    axes: [
      { label: "X", min: 230, max: 245 },
      { label: "Y", min: 144, max: 258 },
    ],
  },
  {
    id: "4",
    status: "successed",
    statusText: "Success",
    code: "QFP CHIP 41-04",
    codeColor: "#83594D",
    confidence: 89,
    axes: [
      { label: "X", min: 230, max: 245 },
      { label: "Y", min: 144, max: 258 },
    ],
  },
];

export default function Product() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const hasInitializedViewRef = useRef(false);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/sample/sample-sam3.png";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!hostRef.current) return;

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setCanvasSize({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    });

    ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;
    if (canvasSize.width === 0 || canvasSize.height === 0) return;
    if (hasInitializedViewRef.current) return;

    const fitScale = Math.min(canvasSize.width / img.width, canvasSize.height / img.height);
    const initialScale = fitScale * 0.7;

    const drawW = img.width * initialScale;
    const drawH = img.height * initialScale;

    setScale(initialScale);
    setOffset({
      x: (canvasSize.width - drawW) / 2,
      y: (canvasSize.height - drawH) / 2,
    });

    hasInitializedViewRef.current = true;
  }, [canvasSize.width, canvasSize.height, imageLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img || canvasSize.width === 0 || canvasSize.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasSize.width * dpr);
    canvas.height = Math.floor(canvasSize.height * dpr);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }, [canvasSize, scale, offset, imageLoaded]);

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextScale = Math.min(8, Math.max(0.1, scale * zoomFactor));
    const worldX = (mouseX - offset.x) / scale;
    const worldY = (mouseY - offset.y) / scale;
    setOffset({
      x: mouseX - worldX * nextScale,
      y: mouseY - worldY * nextScale,
    });
    setScale(nextScale);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      panStartRef.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    };

    const onUp = () => setIsPanning(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  return (
    <div className={styles.widget}>
      <div className={styles["gnb-component"]}>AI View</div>

      <div className={styles.browser}>
        <div className={styles["lnb-component"]}>
          <div className={styles["lnb-component-menu"]}>메인메뉴</div>
          <div className={styles["lnb-component-menu"]}>공정부품</div>
          <div className={styles["lnb-component-menu"]}>즐겨찾기</div>
        </div>
        <div className={styles["viewport-layout"]}>
          <div className={styles.viewport}>
            <div ref={hostRef} className={styles["canvas-host"]}>
              <canvas
                ref={canvasRef}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onContextMenu={(e) => e.preventDefault()}
                className={isPanning ? styles.panning : ""}
              />
            </div>
            <div className={styles["gnb-viewport"]}>
              <button className={styles["select-product-button"]}>
                <div className={styles["select-product-icon-layout"]}>
                  <img src="/assets/sample/semiconductor.svg" />
                </div>
                PEB-07
                <span>▼</span>
              </button>

              <div className={styles["chip-bar"]}>
                <button className={styles.active}>filled View</button>
                <button>Wireframe</button>
              </div>

              <div className={styles["range-bar"]}>
                <input type="range" className={styles["viewport-range"]} />
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className={styles["lnb-view"]}>
            <div className={styles["search-bar"]}>
              <input type="text" placeholder="Search Product" />
              <img src="/assets/icon/search-icon.svg" />
            </div>

            <div className={styles.linearlayout}>
              <div className={styles["product-card"]}>
                <div className={styles["product-image"]}>
                  <img src="/assets/sample/sample-product1.png" />
                </div>
                <div className={styles["product-detail"]}>
                  <div className={styles["product-name"]}>Mounting Hole 15</div>
                  <div className={styles["product-description"]}>
                    <div className={styles["product-description-row"]}>
                      <span>인식 부품</span>
                      <span>7개</span>
                    </div>
                    <div className={styles["product-description-row"]}>
                      <span>불량률</span>
                      <span>0개</span>
                    </div>
                    <div className={styles["product-description-row"]}>
                      <span>결함률</span>
                      <span>0개</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["product-card"]}>
                <div className={styles["product-image"]}>
                  <img src="/assets/sample/sample-product2.png" />
                </div>
                <div className={styles["product-detail"]}>
                  <div className={styles["product-name"]}>QFP CHIP 41</div>
                  <div className={styles["product-description"]}>
                    <div className={styles["product-description-row"]}>
                      <span>인식 부품</span>
                      <span>6개</span>
                    </div>
                    <div className={styles["product-description-row"]}>
                      <span>불량률</span>
                      <span className={styles.defected}>2개</span>
                    </div>
                    <div className={styles["product-description-row"]}>
                      <span>결함률</span>
                      <span>0개</span>
                    </div>
                  </div>
                </div>
                <button>▼</button>
              </div>

              {productResults.map((item) => (
                <div key={item.id} className={styles["product-detail-card"]}>
                  <div className={`${styles.result} ${styles[item.status]}`}>{item.statusText}</div>

                  <div className={styles["product-detail-description-row"]}>
                    <span>인식 번호</span>
                    <span style={{ color: item.codeColor }}>{item.code}</span>
                  </div>

                  <div className={styles["product-detail-description-row"]}>
                    <span>신뢰값</span>
                    <span>{item.confidence}%</span>
                  </div>

                  <div className={styles["product-detail-description-row"]}>
                    <span>인식좌표</span>
                    {item.axes.map((axis) => (
                      <div key={axis.label} className={styles.axis}>
                        <div>{axis.label}</div>
                        <div>{axis.min}</div>
                        <div>{axis.max}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
