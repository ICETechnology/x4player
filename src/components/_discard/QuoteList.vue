<template>
	<div class="quote-list-ctn flex-column">
		<SlideTab ref="slideTab" class="slide-tab" :tabList="clsList" @symbolChanged="onSymbolChanged"></SlideTab>
		<!-- Handle 左右滑動 -> 送給 SlideTab trigger 切換 -->
		<SwipeDetection class="flex-1" @swipe="onSwipe">
			<transition :name="transitionName">
				<!-- 每個分類都對應一組 ScrollBounce，但只有當前 active 的會存在 -->
				<ScrollBounce
					class="FULL quote-list-body"
					v-scroll-lock="true"
					v-for="cls in clsList"
					:key="cls.label"
					v-if="cls.label===activeLabel">
					<!-- 此分類表底下所有的 symbol 對應為 QuoteCard -->
					<QuoteCard class="quote-card-ctn" v-for="sid in sidList" :sid="sid" :key="sid"
						:active="true" :suspend="suspend"></QuoteCard>
				</ScrollBounce>
			</transition>
		</SwipeDetection>
	</div>
</template>

<script>
export default {
	props: ["suspend"],
	data() {
		return {
			// 滑動切換效果
			transitionName: "slide-left",
			// 當前切到的分類
			activeLabel: "",
			// 當前交易所對應到的分類列表
			clsList: [],
			// 當前分類所對應的合約列表
			sidList: [],
		};
	},
	beforeMount() {},
	mounted() {
		let self = this;
		//偵測ExchangeSelect元件發出的事件
		eventBus.$on("ES-CHANGE", obj => {
			if(obj.length){
				self.clsList = obj;
			}
		});
	},
	beforeDestroy() {
		//解除偵測ExchangeSelect元件發出的事件
		eventBus.$off("ES-CHANGE");
	},
	components: {},
	methods: {
		// 來自 SlideTab 的切換合約列表事件
		onSymbolChanged(label, contracts) {
			this.activeLabel = label;
			this.sidList = contracts;
		},
		// 滑動切換事件
		onSwipe(direction) {
			if (direction === "left") {
				this.transitionName = "slide-left";
				this.$refs.slideTab.moveSelectTab(1);
			} else if (direction === "right") {
				this.transitionName = "slide-right";
				this.$refs.slideTab.moveSelectTab(-1);
			}
		},
	},
};
</script>

<style>
.quote-list-ctn {
}
.quote-list-ctn .quote-list-body {
	/* has to be scroll, not auto */
	overflow-y: scroll;
	/* ios scrolling 优化 */
	-webkit-overflow-scrolling: touch;
}
.quote-list-ctn .quote-list-body::-webkit-scrollbar {
	display: none;
}
.quote-list-ctn .slide-tab {
	height: 3em;
}
.quote-card-ctn {
	margin: 0.6em;
	height: 45px;
	border-bottom: 1px solid #333;
}
</style>