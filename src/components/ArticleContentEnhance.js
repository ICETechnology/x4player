export default {
	props: [],
	data: function () {
		return {
			// mapTxtToOptCloud: {
			// 	'IV 龙虎榜': "IVRank",
			// 	'IV龙虎榜': "IVRank",
			// 	'持仓量': "OIRank",
			// 	'隐含波': "IVVariety",
			// 	'历史波': "HistoryVolatility",
			// 	'Skew': "Skew",
			// 	'升贴水': "PremiumDiscount",
			// 	'最痛点': "MaxPain",
			// 	'成交异常': "VolumeMonitor",
			// 	'指数增强': "IndexStrategy",
			// 	'价量十字': "VolumeVariety",
			// 	'期限结构': "TermStructure",
			// 	'动物园': "Zoo",
			// 	'神奇比': "MagicRatio",
			// 	'隐波曲面': "ImpliedSurface",
			// 	'起暴点': "InitiationPoint",
			// }
		}
	},
	mounted() {
		window.popupOptCloud = this.popupOptCloud;
	},
	computed: {
		content() {
			let txt = this.articleContent || (this.param && this.param.article ? this.param.article.desc : null);
			if (txt) {
				for (let key in this.mapTxtToOptCloud) {
					let ocID = this.mapTxtToOptCloud[key];
					txt = txt.replaceAll(key, `<span class="oc-link" onclick="window.popupOptCloud({id: '${ocID}', name: '${key}'})">${key}</span>`);
				}
			}
			return txt;
		},
		mapTxtToOptCloud() {
			return this.$store.state.config.quotePdSetting.function.replace;
		},
	},
	watch: {
		// 將所有的 <a> 替換為自製的 <span> 以執行 cordova.InAppBrowser 另開瀏覽器
		content(nv) {
			setTimeout((self)=>{
				let elms = self.$refs.contentCtn.getElementsByTagName('a');
				for (let i=0; i<elms.length; i++) {
					let orgElm = elms[i];
					let newElm = document.createElement('span');
					newElm.className = "a-link";
					newElm.setAttribute('src', orgElm.href);
					newElm.innerHTML = orgElm.innerHTML;
					newElm.onclick = (e)=>{
						let src = e.srcElement.closest('.a-link').getAttribute('src');
						window.openLink(src);
					};
					orgElm.parentNode.replaceChild(newElm, orgElm);
				};
			}, 500, this);
		},
	},
	beforeDestroy() {
	},
}