"use client";

import { useState, type CSSProperties } from "react";
import data from "./data/bage-presentation.json";
import "./bage-icms.css";

type Point = { year: number; value: number };
type Series = { name: string; color: string; points: Point[] };
type Unit = "share" | "index" | "currency";
type Hovered = Point & { seriesName: string; color: string; x: number; y: number };

const COLORS = { rust: "#bb4e36", forest: "#263e35", blue: "#39798a", gold: "#cf9c3b", sage: "#7e9988", lilac: "#8f82a4" };
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 4 });
const pctShort = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 2 });
const compactMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const exactMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const pp = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 6 });
const moneyPerHundred = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RULE_WEIGHTS = {
  2023: { vaf: .75, education: 0 },
  2024: { vaf: .65, education: .10 },
  2025: { vaf: .65, education: .114 },
  2026: { vaf: .65, education: .128 },
} as const;

const RULE_TABLE = [
  { criterion: "Valor adicionado fiscal (VAF)", values: [75, 65, 65, 65, 65, 65, 65] },
  { criterion: "Área", values: [7, 7, 7, 7, 7, 7, 7] },
  { criterion: "População", values: [7, 7, 5.6, 4.2, 2.8, 1.4, 0] },
  { criterion: "Propriedades rurais", values: [5, 5, 4.9, 4.8, 4.7, 4.6, 4.5] },
  { criterion: "Produtividade primária", values: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5] },
  { criterion: "Inverso do VAF per capita", values: [2, 2, 2, 2, 2, 2, 2] },
  { criterion: "Programa de Integração Tributária", values: [.5, .5, .6, .7, .8, .9, 1] },
  { criterion: "Educação (PRE)", values: [0, 10, 11.4, 12.8, 14.2, 15.6, 17] },
] as const;

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function indexed(points: Point[]) {
  const sorted = [...points].sort((a, b) => a.year - b.year);
  const base = sorted.find((point) => point.year === 2010 && point.value > 0)?.value;
  return base ? sorted.map((point) => ({ year: point.year, value: point.value / base * 100 })) : [];
}

function axisLabel(value: number, unit: Unit) {
  if (unit === "share") return pctShort.format(value);
  if (unit === "currency") return compactMoney.format(value);
  return decimal.format(value);
}

function exactLabel(value: number, unit: Unit) {
  if (unit === "share") return pct.format(value);
  if (unit === "currency") return exactMoney.format(value);
  return `${decimal.format(value)} pontos (2010 = 100)`;
}

function Chart({ series, unit, ariaLabel, floor, baseLine, axisTitle }: { series: Series[]; unit: Unit; ariaLabel: string; floor?: number; baseLine?: number; axisTitle?: string }) {
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const usable = series.filter((item) => item.points.length);
  const values = usable.flatMap((item) => item.points.map((point) => point.value));
  const years = usable.flatMap((item) => item.points.map((point) => point.year));
  if (!values.length) return <div className="bi-empty">Série não disponível.</div>;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const observedMin = Math.min(...values, finite(baseLine) ? baseLine : Infinity);
  const observedMax = Math.max(...values, finite(baseLine) ? baseLine : -Infinity);
  const rawSpan = observedMax - observedMin || Math.abs(observedMax || 1) * .1;
  const min = finite(floor) ? floor : observedMin - rawSpan * .12;
  const max = observedMax + Math.max(rawSpan * .14, Math.abs(observedMax) * .025);
  const width = 980;
  const height = 410;
  const pad = { top: 28, right: 34, bottom: 58, left: 94 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const x = (year: number) => pad.left + ((year - minYear) / Math.max(1, maxYear - minYear)) * plotWidth;
  const y = (value: number) => pad.top + ((max - value) / Math.max(.000001, max - min)) * plotHeight;
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const yearTicks = Array.from(new Set([minYear, 2015, 2020, maxYear].filter((year) => year >= minYear && year <= maxYear))).sort((a, b) => a - b);

  return <div className="bi-chart-shell">
    <div className="bi-chart-canvas">
      <svg className="bi-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {ticks.map((tick) => <g key={tick}>
          <line className="bi-grid" x1={pad.left} y1={y(tick)} x2={width - pad.right} y2={y(tick)} />
          <text className="bi-axis" x={pad.left - 15} y={y(tick) + 4} textAnchor="end">{axisLabel(tick, unit)}</text>
        </g>)}
        {axisTitle && <text className="bi-axis-title" transform={`translate(22 ${pad.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">{axisTitle}</text>}
        {finite(baseLine) && <>
          <line className="bi-baseline" x1={pad.left} y1={y(baseLine)} x2={width - pad.right} y2={y(baseLine)} />
          <text className="bi-baseline-label" x={width - pad.right} y={y(baseLine) - 9} textAnchor="end">base 2010 = 100</text>
        </>}
        {yearTicks.map((year) => <text key={year} className="bi-axis" x={x(year)} y={height - 20} textAnchor="middle">{year}</text>)}
        {usable.map((entry) => <g key={entry.name}>
          <path className="bi-path" d={[...entry.points].sort((a, b) => a.year - b.year).map((point, index) => `${index ? "L" : "M"}${x(point.year)},${y(point.value)}`).join(" ")} stroke={entry.color} />
          {entry.points.map((point) => {
            const px = x(point.year); const py = y(point.value);
            const activate = () => setHovered({ ...point, seriesName: entry.name, color: entry.color, x: px, y: py });
            return <g key={`${entry.name}-${point.year}`} tabIndex={0} role="button" aria-label={`${entry.name}, ${point.year}: ${exactLabel(point.value, unit)}`} onMouseEnter={activate} onMouseLeave={() => setHovered(null)} onFocus={activate} onBlur={() => setHovered(null)} onClick={activate}>
              <circle className="bi-hit" cx={px} cy={py} r="15" />
              <circle className="bi-point" cx={px} cy={py} r="5" fill={entry.color} />
            </g>;
          })}
        </g>)}
      </svg>
      {hovered && <div className="bi-tooltip" style={{ left: `${hovered.x / width * 100}%`, top: `${hovered.y / height * 100}%` }}>
        <span><i style={{ background: hovered.color }} />{hovered.seriesName}</span><strong>{exactLabel(hovered.value, unit)}</strong><small>{hovered.year}</small>
      </div>}
    </div>
    <div className="bi-legend">{usable.map((entry) => <span key={entry.name}><i style={{ background: entry.color }} />{entry.name}</span>)}</div>
  </div>;
}

type WaterfallStep = { label: string; value: number; kind: "total" | "change"; color: string };

function WaterfallChart({ start, end, changes }: { start: number; end: number; changes: Omit<WaterfallStep, "kind">[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const steps: WaterfallStep[] = [
    { label: "IPM 2023", value: start, kind: "total", color: COLORS.forest },
    ...changes.map((change) => ({ ...change, kind: "change" as const })),
    { label: "IPM 2026", value: end, kind: "total", color: COLORS.blue },
  ];
  let running = start;
  const plotted = steps.map((step, index) => {
    if (step.kind === "total") return { ...step, from: 0, to: step.value, index };
    const from = running;
    running += step.value;
    return { ...step, from, to: running, index };
  });
  const width = 1040;
  const height = 420;
  const pad = { top: 42, right: 28, bottom: 105, left: 90 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const max = Math.max(...plotted.flatMap((step) => [step.from, step.to])) * 1.12;
  const slotWidth = plotWidth / plotted.length;
  const x = (index: number) => pad.left + slotWidth * (index + .5);
  const y = (value: number) => pad.top + ((max - value) / max) * plotHeight;
  const barWidth = Math.min(92, slotWidth * .62);
  const ticks = Array.from({ length: 5 }, (_, index) => max * index / 4);

  return <div className="bi-waterfall-wrap">
    <svg className="bi-waterfall" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Decomposição da variação do IPM de Bagé entre 2023 e 2026">
      {ticks.map((tick) => <g key={tick}>
        <line className="bi-grid" x1={pad.left} y1={y(tick)} x2={width - pad.right} y2={y(tick)} />
        <text className="bi-axis" x={pad.left - 14} y={y(tick) + 4} textAnchor="end">{pp.format(tick)}%</text>
      </g>)}
      {plotted.slice(0, -1).map((step, index) => <line key={`connector-${step.label}`} className="bi-waterfall-connector" x1={x(index) + barWidth / 2} x2={x(index + 1) - barWidth / 2} y1={y(step.to)} y2={y(step.to)} />)}
      {plotted.map((step, index) => {
        const top = Math.min(y(step.from), y(step.to));
        const naturalHeight = Math.abs(y(step.from) - y(step.to));
        const displayHeight = Math.max(3, naturalHeight);
        const signed = step.kind === "change" ? `${step.value >= 0 ? "+" : "−"}${pp.format(Math.abs(step.value))} p.p.` : `${pp.format(step.value)}%`;
        return <g key={step.label} className="bi-waterfall-step" tabIndex={0} role="button" aria-label={`${step.label}: ${signed}`} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onClick={() => setHovered(index)}>
          <rect x={x(index) - barWidth / 2} y={naturalHeight < 3 ? top - 1.5 : top} width={barWidth} height={displayHeight} fill={step.color} rx="2" />
          <text className="bi-waterfall-value" x={x(index)} y={top - 11} textAnchor="middle">{signed}</text>
          <text className="bi-waterfall-label" x={x(index)} y={height - 62} textAnchor="middle">{step.label}</text>
        </g>;
      })}
    </svg>
    {hovered !== null && <div className="bi-waterfall-tooltip"><strong>{plotted[hovered].label}</strong><span>{plotted[hovered].kind === "change" ? `${plotted[hovered].value >= 0 ? "+" : "−"}${pp.format(Math.abs(plotted[hovered].value))} ponto percentual` : `${pp.format(plotted[hovered].value)}% do IPM estadual`}</span></div>}
  </div>;
}

export default function BageIcmsPresentation() {
  const [revenueKey, setRevenueKey] = useState<"both" | "iss" | "icms_full">("icms_full");
  const [analysisMode, setAnalysisMode] = useState<"index" | "current">("index");
  const [compositionMode, setCompositionMode] = useState<"share" | "value">("share");
  const [driverYear, setDriverYear] = useState<2024 | 2025 | 2026>(2026);
  const fullYears = data.annual.filter((row) => row.fullYear);
  const ipm = data.annual.flatMap((row) => finite(row.ipmShare) ? [{ year: row.year, value: row.ipmShare }] : []);
  const localIndex = indexed(fullYears.flatMap((row) => finite(row.revenue[revenueKey]) && row.revenue[revenueKey]! > 0 ? [{ year: row.year, value: row.revenue[revenueKey]! }] : []));
  const restIndex = indexed(fullYears.flatMap((row) => finite(row.rest[revenueKey]) && row.rest[revenueKey]! > 0 ? [{ year: row.year, value: row.rest[revenueKey]! }] : []));
  const localCurrent = fullYears.flatMap((row) => finite(row.revenue[revenueKey]) && row.revenue[revenueKey]! > 0 ? [{ year: row.year, value: row.revenue[revenueKey]! }] : []);
  const fiscalShare = data.annual.flatMap((row) => finite(row.fiscalShare.share) ? [{ year: row.year, value: row.fiscalShare.share }] : []);
  const labels = { both: "ISS + cota-parte do ICMS", iss: "ISS", icms_full: "Cota-parte do ICMS" };
  const components = [
    { key: "vaf", label: "Valor adicionado (VAF)", color: COLORS.rust },
    { key: "education", label: "Educação", color: COLORS.gold },
    { key: "population", label: "População", color: COLORS.forest },
    { key: "area", label: "Área", color: COLORS.sage },
    { key: "other", label: "Outros critérios", color: COLORS.lilac },
  ] as const;
  const componentSeries = components.map((component) => ({
    name: component.label,
    color: component.color,
    points: data.annual.flatMap((row) => {
      if (compositionMode === "value" && !row.fullYear) return [];
      const source = compositionMode === "share" ? row.composition : row.compositionValue;
      const value = source[component.key];
      return finite(value) ? [{ year: row.year, value }] : [];
    }),
  }));
  const ipm2024 = data.annual.find((row) => row.year === 2024)!.ipmShare!;
  const ipm2025 = data.annual.find((row) => row.year === 2025)!.ipmShare!;
  const share2025 = data.annual.find((row) => row.year === 2025)!.fiscalShare.share!;
  const decompositionRows = data.annual.filter((row) => row.year >= 2023 && row.year <= 2026);
  const row2023 = data.annual.find((row) => row.year === 2023)!;
  const row2026 = data.annual.find((row) => row.year === 2026)!;
  const waterfallChanges = components.map((component) => ({
    label: component.label === "Valor adicionado (VAF)" ? "VAF" : component.label === "Outros critérios" ? "Outros" : component.label,
    value: ((row2026.ipmShare! * row2026.composition[component.key]) - (row2023.ipmShare! * row2023.composition[component.key])) * 100,
    color: component.color,
  }));
  const driverRow = data.annual.find((row) => row.year === driverYear)!;
  const weights = RULE_WEIGHTS[driverYear];
  const vafContribution = driverRow.ipmShare! * driverRow.composition.vaf;
  const educationContribution = driverRow.ipmShare! * driverRow.composition.education;
  const driverItems = [
    { label: "VAF", color: COLORS.rust, weight: weights.vaf, poolShare: vafContribution / weights.vaf, contribution: vafContribution },
    { label: "Educação (PRE)", color: COLORS.gold, weight: weights.education, poolShare: educationContribution / weights.education, contribution: educationContribution },
  ];
  const maxPoolShare = Math.max(...driverItems.map((item) => item.poolShare));

  return <main className="bi-site">
    <header className="bi-topbar">
      <a className="bi-brand" href="#inicio"><span>B</span><div><strong>Bagé</strong><small>Participação municipal no ICMS</small></div></a>
      <nav><a href="#ipm">IPM</a><a href="#evolucao">Receitas</a><a href="#composicao">Composição</a><a href="#regras">Regras</a><a href="#metodologia">Fontes</a></nav>
    </header>

    <section className="bi-hero" id="inicio">
      <div className="bi-hero-main">
        <p className="bi-eyebrow">FNP · perfil municipal</p>
        <h1>ICMS em<br /><em>Bagé</em></h1>
        <p className="bi-lead">Como o município participa da cota-parte estadual, como o IPM evoluiu e quais critérios explicam essa trajetória.</p>
        <div className="bi-tags"><span>2010–2025 completos</span><span>2026 até junho</span><span>IPM definitivo</span></div>
      </div>
      <aside className="bi-hero-card">
        <span>IPM definitivo · 2026</span>
        <strong>{pct.format(data.summary.ipm2026)}</strong>
        <p>Participação de Bagé no índice estadual que distribui a cota-parte do ICMS aos municípios gaúchos.</p>
        <div><small>Cota bruta em 2025</small><b>{compactMoney.format(data.summary.cotaIcms2025)}</b></div>
      </aside>
    </section>

    <section className="bi-metrics" aria-label="Indicadores de Bagé">
      <article><span>IPM 2024</span><strong>{pct.format(ipm2024)}</strong><p>Pico recente da participação estadual.</p></article>
      <article><span>IPM 2025</span><strong>{pct.format(ipm2025)}</strong><p>Índice definitivo aplicado no exercício.</p></article>
      <article><span>Cota ICMS · 2025</span><strong>{compactMoney.format(data.summary.cotaIcms2025)}</strong><p>Valor bruto anual.</p></article>
      <article><span>Cota ICMS · jan–jun/2026</span><strong>{compactMoney.format(data.summary.cotaIcms2026S1)}</strong><p>Valor parcial do primeiro semestre.</p></article>
    </section>

    <section className="bi-section" id="ipm">
      <div className="bi-section-head"><p><span>01</span> Participação estadual</p><div><h2>O IPM de Bagé ao longo do tempo</h2><p>O índice mostra a participação do município no rateio da cota-parte do ICMS dentro do Rio Grande do Sul.</p></div></div>
      <article className="bi-panel">
        <div className="bi-panel-copy"><span>Série oficial definitiva</span><h3>Participação anual no IPM do RS</h3><p>Depois de alcançar {pct.format(ipm2024)} em 2024, Bagé passou a {pct.format(ipm2025)} em 2025 e {pct.format(data.summary.ipm2026)} em 2026.</p></div>
        <Chart series={[{ name: "Bagé", color: COLORS.forest, points: ipm }]} unit="share" ariaLabel="Participação anual de Bagé no IPM do Rio Grande do Sul" axisTitle="Participação no IPM (%)" />
      </article>
    </section>

    <section className="bi-section bi-section-dark" id="evolucao">
      <div className="bi-section-head"><p><span>02</span> Evolução nominal</p><div><h2>A receita de Bagé desde 2010</h2><p>Alterne entre a comparação do crescimento — com 2010 igual a 100 — e os valores correntes efetivamente registrados em cada ano.</p></div></div>
      <article className="bi-panel bi-panel-dark">
        <div className="bi-chart-header"><div><span>{analysisMode === "index" ? "Índice nominal · 2010 = 100" : "Valores correntes · R$"}</span><h3>{labels[revenueKey]}</h3><p>{analysisMode === "index" ? "Um ponto em 200 significa que a receita nominal dobrou em relação a 2010; 300 significa que triplicou." : "Valores nominais registrados em cada exercício, sem correção pela inflação. Passe o mouse sobre os pontos para consultar o valor exato."}</p></div><div className="bi-chart-controls"><label><span>Modo de análise</span><select value={analysisMode} onChange={(event) => setAnalysisMode(event.target.value as typeof analysisMode)}><option value="index">Índice — 2010 = 100</option><option value="current">Valores correntes — R$</option></select></label><label><span>Receita analisada</span><select value={revenueKey} onChange={(event) => setRevenueKey(event.target.value as typeof revenueKey)}><option value="icms_full">Cota-parte do ICMS</option><option value="iss">ISS</option><option value="both">ISS + cota-parte</option></select></label></div></div>
        {analysisMode === "index" ? <>
          <div className="bi-index-note"><strong>Base comum</strong><span>Bagé em 2010 = 100</span><span>Restante do país em 2010 = 100</span></div>
          <Chart series={[{ name: "Bagé", color: "#e06d52", points: localIndex }, { name: "Restante do país", color: "#93c4ce", points: restIndex }]} unit="index" floor={100} baseLine={100} axisTitle="Índice nominal (2010 = 100)" ariaLabel={`Índice nominal de ${labels[revenueKey]}, com 2010 igual a 100`} />
        </> : <>
          <div className="bi-current-note"><strong>Valores correntes de Bagé</strong><span>2010–2025 · anos completos</span><span>Sem ajuste pelo IPCA</span></div>
          <Chart series={[{ name: "Bagé", color: "#e06d52", points: localCurrent }]} unit="currency" axisTitle="Valor corrente (R$)" ariaLabel={`Valores correntes de ${labels[revenueKey]} em Bagé`} />
          <p className="bi-scale-note">O restante do país não é sobreposto neste modo porque sua escala, em bilhões de reais, ocultaria a série municipal. Para comparar Bagé com o país, utilize o modo “Índice — 2010 = 100”.</p>
        </>}
      </article>
    </section>

    <section className="bi-section" id="peso">
      <div className="bi-section-head"><p><span>03</span> Peso no orçamento</p><div><h2>ICMS e ISS dentro da receita corrente</h2><p>O indicador mostra quanto a soma dessas duas receitas representou da receita corrente bruta de Bagé em cada período.</p></div></div>
      <article className="bi-panel">
        <div className="bi-panel-copy"><span>Participação na receita municipal</span><h3>ISS + cota-parte do ICMS</h3><p>Em 2025, as duas receitas representaram {pctShort.format(share2025)} da receita corrente bruta do município.</p></div>
        <Chart series={[{ name: "Bagé", color: COLORS.rust, points: fiscalShare }]} unit="share" ariaLabel="Participação do ISS e da cota-parte do ICMS na receita corrente de Bagé" axisTitle="Parcela da receita corrente (%)" />
        <p className="bi-footnote"><strong>Período:</strong> 2010–2025 são anos completos. Em 2026, numerador e denominador cobrem janeiro a junho.</p>
      </article>
    </section>

    <section className="bi-section bi-section-paper" id="composicao">
      <div className="bi-section-head"><p><span>04</span> Critérios de rateio</p><div><h2>O que compõe o IPM de Bagé</h2><p>VAF, educação, população, área e demais critérios ajudam a explicar por que o índice municipal muda.</p></div></div>
      <article className="bi-panel">
        <div className="bi-chart-header"><div><span>Decomposição do índice</span><h3>{compositionMode === "share" ? "Participação de cada critério no IPM" : "Valor estimado da cota por critério"}</h3><p>Os valores em reais são uma decomposição contábil do repasse bruto, não recursos vinculados a cada finalidade.</p></div><label><span>Modo de visualização</span><select value={compositionMode} onChange={(event) => setCompositionMode(event.target.value as typeof compositionMode)}><option value="share">Participação no IPM (%)</option><option value="value">Valor estimado da cota (R$)</option></select></label></div>
        <Chart series={componentSeries} unit={compositionMode === "share" ? "share" : "currency"} ariaLabel="Composição anual do IPM de Bagé por critério" axisTitle={compositionMode === "share" ? "Participação dentro do IPM (%)" : "Valor estimado da cota (R$)"} />
        <p className="bi-footnote"><strong>Importante:</strong> a composição mostra como o índice é formado. Ela não representa vinculação do dinheiro recebido a educação, VAF ou outra finalidade. No modo em reais, 2026 é omitido porque cobre apenas janeiro–junho.</p>
      </article>

      <article className="bi-panel bi-detail-panel">
        <div className="bi-panel-copy"><span>Variação explicada</span><h3>O que levou o IPM de 2023 a 2026</h3><p>O gráfico de ponte mede, em pontos percentuais, quanto cada critério acrescentou ou retirou do índice de Bagé. A educação compensou as perdas em VAF e população.</p></div>
        <WaterfallChart start={row2023.ipmShare! * 100} end={row2026.ipmShare! * 100} changes={waterfallChanges} />
        <div className="bi-reading"><strong>Leitura principal</strong><p>Entre 2023 e 2026, a educação acrescentou <b>+{pp.format(waterfallChanges.find((item) => item.label === "Educação")!.value)} p.p.</b>; o VAF retirou <b>{pp.format(waterfallChanges.find((item) => item.label === "VAF")!.value)} p.p.</b> e a população, <b>{pp.format(waterfallChanges.find((item) => item.label === "População")!.value)} p.p.</b>. O resultado líquido foi um IPM {pp.format((row2026.ipmShare! - row2023.ipmShare!) * 100)} p.p. maior.</p></div>
      </article>

      <article className="bi-panel bi-detail-panel">
        <div className="bi-chart-header"><div><span>Mecanismo do resultado</span><h3>Peso da regra × posição de Bagé</h3><p>O peso estadual de cada critério é multiplicado pela participação de Bagé naquele conjunto. Isso mostra por que transferir peso do VAF para a educação favoreceu o município.</p></div><div className="bi-year-switch" aria-label="Escolha do ano">{([2024, 2025, 2026] as const).map((year) => <button key={year} type="button" className={driverYear === year ? "active" : ""} onClick={() => setDriverYear(year)} aria-pressed={driverYear === year}>{year}</button>)}</div></div>
        <div className="bi-driver-grid">{driverItems.map((item) => <article key={item.label} style={{ "--driver-color": item.color } as CSSProperties}>
          <div className="bi-driver-title"><span>{item.label}</span><strong>{pct.format(item.poolShare)}</strong></div>
          <p>Participação de Bagé dentro do conjunto estadual deste critério</p>
          <div className="bi-driver-track"><i style={{ width: `${item.poolShare / maxPoolShare * 100}%` }} /></div>
          <div className="bi-equation"><span><small>Peso estadual</small><b>{pctShort.format(item.weight)}</b></span><em>×</em><span><small>Bagé no critério</small><b>{pct.format(item.poolShare)}</b></span><em>=</em><span><small>Contribuição ao IPM</small><b>{pp.format(item.contribution * 100)} p.p.</b></span></div>
        </article>)}</div>
        <p className="bi-footnote"><strong>Atenção:</strong> a participação na PRE não é uma nota escolar. Ela combina IMERS e porte municipal, que considera população, matrículas e estudantes em situação de vulnerabilidade.</p>
      </article>

      <article className="bi-panel bi-detail-panel">
        <div className="bi-panel-copy"><span>Tradução para o orçamento</span><h3>{compositionMode === "share" ? "Como cada R$ 100 da cota foi determinado" : "Valor estimado da cota por critério"}</h3><p>{compositionMode === "share" ? "A tabela converte a composição do IPM em uma linguagem direta: quanto de cada R$ 100 recebidos é explicado por cada critério." : "Valores nominais decompostos conforme os componentes do IPM; 2026 corresponde somente a janeiro–junho."}</p></div>
        <div className="bi-table-wrap"><table className="bi-decomposition-table">
          <thead><tr><th>Ano</th>{components.map((component) => <th key={component.key}>{component.label}</th>)}<th>Total</th></tr></thead>
          <tbody>{decompositionRows.filter((row) => compositionMode === "share" || row.fullYear).map((row) => {
            const values = components.map((component) => compositionMode === "share" ? row.composition[component.key] * 100 : row.compositionValue[component.key]);
            const total = values.reduce((sum, value) => sum + value, 0);
            return <tr key={row.year}><th>{row.year}</th>{values.map((value, index) => <td key={components[index].key}>{compositionMode === "share" ? moneyPerHundred.format(value) : compactMoney.format(value)}</td>)}<td><strong>{compositionMode === "share" ? moneyPerHundred.format(total) : compactMoney.format(total)}</strong></td></tr>;
          })}</tbody>
        </table></div>
        <p className="bi-footnote"><strong>Não é vinculação:</strong> os critérios explicam o cálculo do repasse. Eles não obrigam que esses valores sejam gastos em educação, VAF, área ou outra finalidade específica.</p>
      </article>
    </section>

    <section className="bi-section bi-rules" id="regras">
      <div className="bi-section-head"><p><span>05</span> Regras do Rio Grande do Sul</p><div><h2>Como a cota-parte do ICMS é distribuída</h2><p>Do ICMS arrecadado pelo Estado, 25% pertencem aos municípios. O IPM define a fração dessa cota municipal destinada a cada prefeitura.</p></div></div>
      <div className="bi-rule-cards">
        <article><span>1</span><strong>25%</strong><p>Parcela da arrecadação estadual do ICMS pertencente ao conjunto dos municípios.</p></article>
        <article><span>2</span><strong>IPM</strong><p>Índice anual que determina a participação de cada município dentro dessa cota.</p></article>
        <article><span>3</span><strong>Cota × IPM</strong><p>Em termos simplificados, o bolo municipal do período é multiplicado pelo índice de cada município.</p></article>
      </div>
      <article className="bi-panel">
        <div className="bi-panel-copy"><span>Transição legal</span><h3>Pesos dos critérios de 2023 a 2029</h3><p>A educação ganha peso gradualmente, enquanto a população isolada é incorporada ao cálculo educacional e deixa de existir como critério autônomo em 2029.</p></div>
        <div className="bi-table-wrap"><table className="bi-rules-table"><thead><tr><th>Critério</th><th>Até 2023</th><th>2024</th><th>2025</th><th className="is-current">2026</th><th>2027</th><th>2028</th><th>2029</th></tr></thead><tbody>{RULE_TABLE.map((row) => <tr key={row.criterion}><th>{row.criterion}</th>{row.values.map((value, index) => <td key={`${row.criterion}-${index}`} className={index === 3 ? "is-current" : ""}>{decimal.format(value)}%</td>)}</tr>)}</tbody></table></div>
        <div className="bi-rule-notes"><p><strong>VAF:</strong> mede a atividade econômica relativa do município e utiliza a média dos dois anos anteriores.</p><p><strong>Educação:</strong> a PRE combina o IMERS com o porte municipal; não é apenas uma nota de desempenho escolar.</p><p><strong>Ambiental:</strong> não há critério ambiental autônomo no IPM gaúcho atual. Áreas especiais podem influenciar o componente de área calculada.</p><p><strong>Outros critérios:</strong> na visualização de Bagé, propriedades rurais, produtividade primária, inverso do VAF per capita e PIT aparecem agrupados.</p></div>
        <div className="bi-rule-links"><a href="https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html" target="_blank" rel="noreferrer">Constituição Federal · art. 158</a><a href="https://estado.rs.gov.br/upload/arquivos/202411/vf-ppt-coletiva-imers-pptx-nov24-1.pdf" target="_blank" rel="noreferrer">Quadro oficial dos pesos</a><a href="https://www.dee.rs.gov.br/imers" target="_blank" rel="noreferrer">Metodologia IMERS e PRE</a><a href="https://atendimento.receita.rs.gov.br/ipm-indice-de-participacao-dos-municipios" target="_blank" rel="noreferrer">Portal do IPM/RS</a></div>
      </article>
    </section>

    <section className="bi-method" id="metodologia">
      <div><p className="bi-eyebrow">Metodologia e fontes</p><h2>Leitura simples, série documentada</h2><p>Foram utilizados valores brutos da cota-parte do ICMS e arquivos definitivos do IPM publicados pela Receita Estadual do Rio Grande do Sul. O dado fiscal de 2026 corresponde ao primeiro semestre.</p></div>
      <div className="bi-method-cards">
        <article><span>Receitas</span><p>Série nacional consolidada de 2010–2025. Para 2026, MSC acumulada até junho.</p></article>
        <article><span>Correção de 2020</span><p>A DCA registrou o líquido na linha bruta; foi adotado o RREO Anexo 03: {exactMoney.format(49_878_358.08)}.</p></article>
        <article><span>IPM</span><p>Índices e componentes definitivos divulgados pela Receita Estadual/RS.</p></article>
        <article><span>Índice 2010 = 100</span><p>Cada série é dividida por seu próprio valor de 2010 e multiplicada por 100.</p></article>
      </div>
      <div className="bi-sources">{data.sources.map((source) => <a key={source.label} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>
    </section>

    <footer className="bi-footer"><span>Frente Nacional de Prefeitas e Prefeitos · FNP</span><span>Bagé/RS · atualização em {data.meta.updatedAt}</span></footer>
  </main>;
}
