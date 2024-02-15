<template>
    <div v-show="displayBTOList" class="login-trade-limitation FULL">
		<div class="selector-ctn flex-col">
			<div class="flex-1 flex-col pd5">
				<div class="flex-center font-size-big">{{$ln('超过可用登入上限')}}</div>
				<div class="mgtb3">{{$ln('请选择要移除的账号')}}</div>
				<div class="flex-1 posr">
					<ScrollBounce class="FULL" v-stop-propagation-y>
						<div v-for="bto in displayBTOList" :key="getBTID(bto)" class="bto-card flex-row pdtb3 tcef" @click="selectedBTID = getBTID(bto)">
							<div class="flex-1 flex-start">{{bto.traderID}}</div>
							<div>
								<!-- 登入Radio圖示 -->
								<span class="css-radio-btn flex-center" :class="{'selected': getBTID(bto) === selectedBTID}"><span/></span>
							</div>
						</div>
					</ScrollBounce>
				</div>
			</div>
			<div class="flex-row border-top flex-center font-size-small">
				<div class="flex-1 flex-center pd3 tcef border-right" @click="displayBTOList = null">{{$ln('取消')}}</div>
				<div class="flex-1 flex-center pd3 tcef" @click="confirmRemove">{{$ln('移除已登入账号')}}</div>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ['brokerID'],
	data() {
		return {
			displayBTOList: null,
			selectedBTID: '',
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		getBTID(bto) {
			return `${bto.brokerID}|${bto.traderID}`;
		},
		// 由上層呼叫進來檢查數量限制 (return 通過true/不通過false)
		checkLimitation() {
			// 未設定限制時
			if (!this.accountTypeLimitation)
				return true;
			// 預設為通過
			let allow = true;
			// 檢查 [總數量] 的限制
			if (this.accountTypeLimitation['ALL'] && this.loginedBTOListWithoutSim.length + 1 > this.accountTypeLimitation['ALL']) {
				this.displayBTOList = this.loginedBTOListWithoutSim;
				allow = false;
			}
			// 檢查 [當前broker類型] 的限制
			else if (this.accountTypeLimitation[this.bizType] && this.curBizTypeBTOList.length + 1 > this.accountTypeLimitation[this.bizType]) {
				this.displayBTOList = this.curBizTypeBTOList;
				allow = false;
			}
			// 經檢查仍在允許範圍時直接 return true
			if (allow)
				return true;
			// 顯示選單預設選在第一個
			if (this.curBizTypeBTOList.length > 0)
				this.selectedBTID = this.getBTID(this.displayBTOList[0]);
		},
		// 確認視窗
		confirmRemove() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("清除帐号"),
				content: self.$ln("在帐号列表中移除此帐号"),
				confirm: self.removeBTO,
			});	
		},
		// 移除 & 登出
		removeBTO() {
			let tmp = this.selectedBTID.split('|');
			let brokerID = tmp[0];
			let traderID = tmp[1];
			let idx = this.loginedBTOList.findIndex((bto)=>{return bto.brokerID === brokerID && bto.traderID === traderID;});
			this.loginedBTOList.splice(idx, 1);
			// 登出
			M4C.Trader.logout(brokerID, traderID);
			// 關閉顯示
			this.displayBTOList = null;
			// 移除完成事件
			this.$emit('removed');
		},
	},
	watch: {},
    computed: {
		// 已有登入記憶的交易帳號列表
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		// 當前 broker 類型 (STK/FUT/OPT)
		bizType() {
			return this.brokerIdToBizType[this.brokerID];
		},
		// 設定限制
		accountTypeLimitation() {
			return this.$store.state.config.quotePdSetting.trade.account_type_limitation;
		},
		// brokerID to BizType 對應表
		brokerIdToBizType() {
			let map = {};
			this.$store.state.config.quotePdSetting.trade.brokers.forEach((brokerInfo)=>{
				map[brokerInfo.broker_id] = brokerInfo.biz_type;
			});
			return map;
		},
		// 當前 broker 類型 已登入列表
		curBizTypeBTOList() {
			let list = [];
			this.loginedBTOList.forEach((bto)=>{
				if (this.bizType === this.brokerIdToBizType[bto.brokerID]) {
					bto.bizType = this.bizType;
					list.push(bto);
				}
			});
			return list;
		},
		// 不包含 SIM 的記憶中登入帳號列表
		loginedBTOListWithoutSim() {
			return this.loginedBTOList.filter(bto => bto.brokerID !== 'IceTech');
		},
	},
}
</script>

<style scoped>
.login-trade-limitation {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0,0,0,0.5);
}
.selector-ctn {
	position: absolute;
	width: 80%;
	height: 60%;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	border-radius: 15px;
	background-color: #34485E;
	box-sizing: border-box;
}
.bto-card {
	border-bottom: 1px solid rgba(200,200,200,0.6);
}
.border-top {
	border-top: 1px solid rgba(200,200,200,0.59);
}
.border-right {
	border-right: 1px solid rgba(200,200,200,0.59);
}
</style>