<template>
	<ScrollBounce class="FULL font-size-small" v-stop-propagation-y>
		<div class="pdt2 pdlr5 pdb5 flex-col">
			<!-- 下單確認 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`下单确认`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`下单盒`)}}</div>
				<div class="flex-center">
					<Toggle v-model="$store.state.order.confirm" />
				</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`闪电下单`)}}</div>
				<div class="flex-center">
					<Toggle v-model="$store.state.thunder.settings.other.orderConfirm" />
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" />
			<!-- 下單盒 -->
			<div class="mix-float-order-config flex-col" v-if="twMode">
				<div class="setting-line flex-row pd0">
					<div class="flex-1 flex-start clr-gray">{{$ln(`下單盒`)}}</div>
				</div>
				<div class="setting-line flex-row pd0">
					<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`下單後清除買賣別`)}}</div>
					<div class="flex-center">
						<Toggle v-model="$store.state.order.resetBS" />
					</div>
				</div>
				<div class="setting-line flex-row pd0">
					<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`下單後清除口數`)}}</div>
					<div class="flex-center">
						<Toggle v-model="$store.state.order.resetQty" />
					</div>
				</div>
				<div class="setting-line flex-row pd0">
					<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`下單後清除價格`)}}</div>
					<div class="flex-center">
						<Toggle v-model="$store.state.order.resetPrice" />
					</div>
				</div>
				<div v-if="twMode" class="setting-line flex-row pd0">
					<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`委託送出後關閉下單盒`)}}</div>
					<div class="flex-center">
						<Toggle v-model="$store.state.order.closeOrderBox" />
					</div>
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" v-if="twMode" />
			<!-- 快速下單 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`快速下单`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`买进预设`)}}</div>
				<div class="flex-center">
					<radio class="radio-ctn flex-row mgr1" v-model="$store.state.order.fastOrderBuy">
						<span value="B">{{$ln(`买价`)}}</span>
						<span value="S">{{$ln(`卖价`)}}</span>
					</radio>
				</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`卖出预设`)}}</div>
				<div class="flex-center">
					<radio class="radio-ctn flex-row mgr1" v-model="$store.state.order.fastOrderSell">
						<span value="B">{{$ln(`买价`)}}</span>
						<span value="S">{{$ln(`卖价`)}}</span>
					</radio>
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" />
			<!-- 預設下單數量 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`预设下单数量`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`期货`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.futQty" :step="1" :max="orderMaxQty" />
				</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`选择权`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.optQty" :step="1" :max="orderMaxQty" />
				</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`證券`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.stkQty" :step="stkQtyStep" :min="stkQtyStep" />
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" />
			<!-- 每筆下單口數限制(CN版在beforeMount設定為Number.MAX_VALUE=>為了不限制上限)==>不顯示 -->
			<div class="setting-line flex-row pd0" v-if="orderMaxQty != Number.MAX_VALUE">
				<div class="flex-1 flex-start clr-gray">{{$ln(`每筆下單口數限制`)}}</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="orderMaxQty != Number.MAX_VALUE">
				<div class="flex-1 flex-start mgl5 clr-gray"></div>
				<div class="flex-center w40vw order-max-qty">
					<InputQty v-model="$store.state.order.maxQty" :step="1" :min="1" :max="orderMaxLimit" />
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" v-if="orderMaxQty != Number.MAX_VALUE" />
			<!-- 自動拆單 -->
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start clr-gray">{{$ln(`自动拆单`)}}</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`期货拆单数量`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.futSplitQty" :min="0" :step="1" />
				</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`选择权拆单数量`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.optSplitQty" :min="0" :step="1" />
				</div>
			</div>
			<div v-if="!twMode" class="divider-bottom mgb2 mgt4" />
			<!-- 反手 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`持仓反手`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`反手预设价格`)}}</div>
				<div class="flex-center">
					<SingleSelect class="w40vw" title="反手预设价格" :options="oppositeOptList" v-model="$store.state.order.oppositeFlag" />
				</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`加挂跳数`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.oppositeJump" :min="0" :step="1" :disable="$store.state.order.oppositeFlag=='MARKET'"/>
				</div>
			</div>
			<div class="divider-bottom mgb2 mgt4" />
			<!-- 市价转换设定 -->
			<div v-if="pdsettingConvertMarketPrice" class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`市价转换`)}}</div>
			</div>
			<div v-if="pdsettingConvertMarketPrice" class="setting-line flex-row pd0 flex-center">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`市价转换设定`)}}</div>
				<Button class="ht1 rd6 pdlr5 font-size-little" @click="onBtnConvertMarketPrice">{{$ln('设定')}}</Button>
			</div>
			<div v-if="!twMode" class="divider-bottom mgb2 mgt4" />
			<!-- 即時損益試算 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`即時損益試算`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`即時損益試算價格使用`)}}</div>
				<div class="flex-center">
					<radio class="radio-ctn flex-row mgr1" v-model="$store.state.config.profitByOpposite">
						<span value="true">{{$ln(`對手價`)}}</span>
						<span value="false">{{$ln(`成交價`)}}</span>
					</radio>
				</div>
			</div>

			<!-- 其他 -->
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start clr-gray">{{$ln(`其他`)}}</div>
			</div>
			<div class="setting-line flex-row pd0">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`回报音效`)}}</div>
				<div class="flex-center">
					<radio class="radio-ctn flex-row mgr1" v-model="$store.state.config.soundEffect">
						<span value="true">{{$ln(`开启`)}}</span>
						<span value="false">{{$ln(`关闭`)}}</span>
					</radio>
				</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`上期所、INE平仓设定`)}}</div>
				<div class="flex-center">
					<radio class="radio-ctn flex-row mgr1" v-model="$store.state.order.closeShfeIne">
						<span value="PCYD">{{$ln(`先开先平`)}}</span>
						<span value="PCTD">{{$ln(`优先平今`)}}</span>						
					</radio>
				</div>
			</div>
			<div class="setting-line flex-row pd0" v-if="!twMode">
				<div class="flex-1 flex-start mgl5 clr-gray">{{$ln(`超价加挂跳数`)}}</div>
				<div class="flex-center w40vw">
					<InputQty v-model="$store.state.order.overJump" :min="0" :step="1"/>
				</div>
			</div>
			<div class="mgtb5" />
		</div>
	</ScrollBounce>
</template>

<script>
import ConvertMarketPrice from "@/components/ConvertMarketPrice.vue"

export default {
	props: [],
	data() {
		return {
			oppositeOptList: [
				{label:'市价',value:'MARKET'},
				{label:'最新价加挂N跳',value:'LATEST'},
				{label:'对手价加挂N跳',value:'HIT'}
			],
		}
	},
	beforeMount() {},
    mounted() {this.$emit('title', this.$ln('交易设定'))},
	beforeDestroy() {
		console.log('[LogSetting]', '交易設定', this.$store.state.order);
	},
	components: {},
    methods: {
		/** 登出 */
		onBtnLogout() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: () => {
					localStorage.removeItem(this.$store.state.config.projectID + '_AUTO_LOGIN');
					window.location.reload();
				}
			});
		},
		/** 重启 */
		onBtnReload() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "重启",
				content: this.$ln("点击确认重启"),
				confirm: () => {
					eventBus.$emit("CLOSE-CONFIRM");
					this.isLoading = true;
					setTimeout(()=>{
						window.location.reload();
					}, 200);
				}
			});
		},
		// 市價自動轉價
		onBtnConvertMarketPrice() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-DIALOG", ConvertMarketPrice, {}, {transName: 'float'});
		},
	},
	watch: {
		// 同步預設下單數量(如果最大下單限制小於預設下單數量)
		orderMaxQty(nv) {
			// 期貨
			if(nv < this.$store.state.order.futQty) {
				this.$store.state.order.futQty = nv;
			}
			// 選擇權
			if(nv < this.$store.state.order.optQty) {
				this.$store.state.order.optQty = nv;
			}
		},
	},
    computed: {
		stkQtyStep() {return this.$store.state.order.stkQtyStep;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		orderMaxQty() {return this.$store.state.order.maxQty;},
		// 市價轉設定價 pdsetting
		pdsettingConvertMarketPrice() {
			try{return this.$store.state.config.quotePdSetting.function.convertMarketPrice;}catch(e){}
		},
		// 最大下單口數(上限) 無設定取999當上限
		orderMaxLimit() {
			try {
				return this.$store.state.config.publicPdSetting.CONFIG.order.maxLimit;
			} catch (e) {return 999;}
		}
	},
}
</script>

<style scoped>
.pd0 {
	padding: 0;
}
.radio-ctn {
	border: 1px solid #7E8185;
}
/** 桌機版 */
.desktop .w40vw{
	width: 8em;
}
</style>