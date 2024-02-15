
import {EFillPaletteMode, EStrokePaletteMode, DefaultPaletteProvider} from "scichart/Charting/Model/IPaletteProvider";
import { parseColorToUIntArgb } from "scichart/utils/parseColor";
// MACD長條圖依正負值顯示顏色
export class MacdHistogramPaletteProvider extends DefaultPaletteProvider {
    constructor(aboveZeroColor, belowZeroColor) {
        super();
        this.strokePaletteMode = EStrokePaletteMode.GRADIENT;
		this.EFillPaletteMode = EFillPaletteMode.GRADIENT;
        this.aboveZeroArgb = parseColorToUIntArgb(aboveZeroColor);
        this.belowZeroArgb = parseColorToUIntArgb(belowZeroColor);
    }
	overrideFillArgb(xValue, yValue, index) {
		return yValue >= 0 ? this.aboveZeroArgb : this.belowZeroArgb;
	}
    overrideStrokeArgb(xValue, yValue, index, opacity, metadata) {
        return this.overrideFillArgb(xValue, yValue, index);
    }
}
// 當前tick依開收價差顯示漲跌顏色
export class OhlcPaletteProvider extends DefaultPaletteProvider {
    constructor(ohlcSeries, upWick, downWick, upFill, downFill, equalsWick, equalsFill) {
        super();
        this.ohlcSeries = ohlcSeries;
        this.upWick = parseColorToUIntArgb(upWick);
        this.downWick = parseColorToUIntArgb(downWick);
        this.upFill = parseColorToUIntArgb(upFill);
        this.downFill = parseColorToUIntArgb(downFill);
        this.equalsWick = parseColorToUIntArgb(equalsWick || upWick);
        this.equalsFill = parseColorToUIntArgb(equalsFill || upFill);
    }
	overrideFillArgb(xValue, yValue, index) {
        if(this.ohlcSeries == null || this.ohlcSeries.count() == 0) return null;
        let close = this.ohlcSeries.getNativeCloseValues().get(index);
        let open = this.ohlcSeries.getNativeOpenValues().get(index);
        return close > open? this.upFill: close == open? this.equalsFill: this.downFill;
	}
    overrideStrokeArgb(xValue, yValue, index, opacity, metadata) {
        if(this.ohlcSeries == null || this.ohlcSeries.count() == 0) return null;
        let close = this.ohlcSeries.getNativeCloseValues().get(index);
        let open = this.ohlcSeries.getNativeOpenValues().get(index);
        return close > open? this.upWick: close == open? this.equalsWick: this.downWick;
    }
}
// 依前tick收與當前tick收價差顯示漲跌顏色
export class OhlcPaletteProvider_V extends DefaultPaletteProvider {
    constructor(ohlcSeries, upWick, downWick, upFill, downFill, equalsWick, equalsFill) {
        super();
        this.ohlcSeries = ohlcSeries;
        this.upWick = parseColorToUIntArgb(upWick);
        this.downWick = parseColorToUIntArgb(downWick);
        this.upFill = parseColorToUIntArgb(upFill);
        this.downFill = parseColorToUIntArgb(downFill);
        this.equalsWick = parseColorToUIntArgb(equalsWick || upWick);
        this.equalsFill = parseColorToUIntArgb(equalsFill || upFill);
    }
	overrideFillArgb(xValue, yValue, index) {
        if(this.ohlcSeries == null || this.ohlcSeries.count() == 0) return null;
        let close = this.ohlcSeries.getNativeCloseValues().get(index);
        let open = this.ohlcSeries.getNativeOpenValues().get(index);
        let preClose = this.ohlcSeries.getNativeCloseValues().get(index - 1);
        // 如果沒前一tick(ex:第一根)，則取當前tick開的價格判斷。
        return close > (preClose || open)? this.upFill: close == (preClose || open)? this.equalsFill: this.downFill;
	}
    overrideStrokeArgb(xValue, yValue, index, opacity, metadata) {
        if(this.ohlcSeries == null || this.ohlcSeries.count() == 0) return null;
        let close = this.ohlcSeries.getNativeCloseValues().get(index);
        let open = this.ohlcSeries.getNativeOpenValues().get(index);
        let preClose = this.ohlcSeries.getNativeCloseValues().get(index - 1);
        // 如果沒前一tick(ex:第一根)，則取當前tick開的價格判斷。
        return close > (preClose || open)? this.upWick: close == (preClose || open)? this.equalsWick: this.downWick;
    }
}