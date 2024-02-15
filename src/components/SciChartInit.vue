<template>
    <!-- 建一個看不到的 scichart 讓 scichart2d.data 與 scichart2d.wasm 先下載好 -->
    <div id="scichart-init" class="hidden"></div>
</template>

<script>
import 'regenerator-runtime/runtime'
import {SciChartSurface} from "scichart/Charting/Visuals/SciChartSurface";

export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {
        this.initSciChart();
    },
	beforeDestroy() {},
	components: {},
    methods: {
		initSciChart() {
			// 設定 scichart source
			SciChartSurface.configure({
				dataUrl: `${window.cloudPath}/scichart2d.data?v=2.2.2415`,
				wasmUrl: `${window.cloudPath}/scichart2d.wasm?v=2.2.2415`
			});
            // 設定 scichart runtime license key (host 有調整後，都需要重新取得)
			SciChartSurface.setRuntimeLicenseKey(this.licenseKey);
            this.createSciChart();
		},
		async createSciChart() {
			await SciChartSurface.create("scichart-init");
		},
    },
	watch: {},
    computed: {
		licenseKey() {
			// https://trello.com/c/TNrLXxQe
			let key = "mlbUgSNTBqtOyUSdAJCvSiqHhQzVShHKwCDVp6dkuFnrwdBuglJwirwq6gwfMW0F2lZZmyhlt1FFmTnOkinOmP3EhEYxTI4m1S/n6waoiqiLSx0Wbz1FiZbMEmK1azgdca++OfFM8+ZIMqxV9LE9Q+j/gBH2eEopoMKNqWu49w9TiDcINB0wxbgX11RAIC0P8wHvGOJD0Y5rp/RQIt/tt5lbmzWnHb+KW6Szr2mU02z50KBDKURHjeFLqQ2n0aLH/A7tMOoMC3wlgafid5cJ9qUs4XmsgL7BWoGmLFjPHGCCtJ8/h/3Gwz6o/rnqp+c8kjBQbCqqaO59J/P9pFg+YWUmY1Y9Nj4AH9qWFTpn339IkLXjD8Z1WoXb+Wou6AoSnvkka7IUolrEEjOyX72dBLEw8VZHkCVFFRi+m6FDUadoPJlOhBO0cGo8nisX7MNLR31U8rjEk64pAl4p82UuVeCicnBsGS5gxHDeEt5zIkebSosBJ5g8rT7N2B1Gp1kTBKPLeCSdkyo+xnOmlxGVQWRhgHJnT6SEeeTXgvzrI+p+faBguYap8+k0bFARZO151+eWuB2EgN+5cadlyCDO2ap/QeDsx2RP3Eiq1qPTsCLaNI3tBmCYc40xrRcPW9lU6J91lMDB7S1qCefK8LetAeQCo/FHF+u/kfwbpLbIw8l2T42Yj5cIlcCdojHJLxF39x0TCgsB0jM5SWufC2GXvu0F+rM3yOV1pp1jwUCy2lK8+UhbBXEh9Hf5mUhorMftOSiqCN4ZZRKDlR70PcvxrXl8kqD6XGtm4cMiOVEjMd9YX0mp8Po0smITzwuqU49dcwTCZKymeq0L07xZU1GHtfaCCxbS0POJfUNXYOLjHWiIUAS8MHassiSnJkQvVEhkrj24aZ0Uhi2diNwCAAIsAwyz0Zw=";
			try{key = this.$store.state.config.quotePdSetting.scichart.licenseKey;}catch(e){}
			return key;
		},
	},
}
</script>

<style scoped>
</style>