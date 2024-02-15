<template>
    <div class="flex-column trading-account-manager-ctn">
		<div class="flex-1 flex-col pdb5">
			<div class="flex-1 flex-col flex-center pdtb2">
				<!-- 交易帳號選擇器 -->
				<LoginedBTOSelector class="logined-bto-selector" :logined="true" :readonly="!loginMoreTrader" />
				<div class="flex-1"/>
				<div class="flex-center mgt5 flex-row w100p" v-if="showOption1">
					<Button v-show="displayChangePasswordBtn" class="btn-confirm" :disabled="!traderID?'disabled':''" @click="onChangePassword">{{$ln('修改密码')}}</Button>
					<div class="flex-1"/>
					<Button class="btn-confirm" :disabled="!traderID?'disabled':''" v-if="enableSettlement" @click="onBtnSettlement">{{$ln('结算单')}}</Button>
				</div>
                <div class="flex-center mgtb5 flex-row w100p" v-if="showOption2">
					<Button v-if="loginMoreTrader" class="btn-confirm dark" @click="onBtnDelete">{{$ln(`删除`)}}</Button>
					<div v-if="loginMoreTrader" class="flex-1"/>
                    <Button class="btn-confirm dark" :class="{'flex-1': !loginMoreTrader}" :disabled="!traderID?'disabled':''" @click="onBtnLogout">{{$ln('登出')}}</Button>
                </div>
				<div class="flex-center flex-row w100p" v-if="twMode">
					<Button class="btn-confirm bgc-0065A4 flex-1" :disabled="!traderID?'disabled':''" @click="onClose">{{$ln('确定')}}</Button>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import Password from "@/components/Password.vue"
export default {
	props: ['param', 'suspend'],
	data() {
		return {
			projectName: this.$store.state.login.brokerName,
        }
	},
	beforeMount() {
		this.$emit('title', `管理资金帐户`);
	},
    mounted() {
    },
    methods: {
		onNotice() {
			// 不在各組件初始化時查詢，只在開出三大提醒視窗時全部重新查詢一次。
			M4C.CommonQuery.queryAllNotice();
			eventBus.$emit('POPUP-DIALOG', "NoticeMSG");
		},
		/** 行權記錄 */
		onBtnExerciseRecord() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', "ExerciseRecord");
		},
		onBtnSettlement() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			let config = {transName: 'float'};
			// if (this.isDesktop) {
			// 	// config.style= "width: 80%; height: 70%; top: 15%; left: 10%;";
			// 	config.size= "big";
			// }
			eventBus.$emit('POPUP-DIALOG', 'Settlement', "", config);
		},
		onChangePassword(){
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', Password, '', {transName: 'float'});
		},
		// 刪除此帳號
		onBtnDelete() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("清除帐号"),
				content: self.$ln("在帐号列表中移除此帐号"),
				confirm: () => {
					// 呼叫 Sim 核心登出(清除相關資料)
					if (self.brokerID === 'IceTech') {
						M4C.Sim.logout();
					}
					let idx = self.loginedBTOList.findIndex((bto)=>{return bto.brokerID === self.brokerID && bto.traderID === self.traderID;});
					self.loginedBTOList.splice(idx, 1);
					// 登出
					M4C.Trader.logout();
					// 關閉自己
					eventBus.$emit("CLOSE-DIALOG", self.$parent);
					// 自動切到首個帳號 (已登入帳號原本就會排在最前面)
					setTimeout(()=>{
						let bto = this.$store.state.sortedBTOList[0];
						if (bto) M4C.BTO.setSelectedBTO(bto);
					}, 200);
				}
			});
		},		
		onBtnLogout() {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "登出",
				content: this.$ln("点击确认登出"),
				confirm: ()=>{
					// 登出交易帳號時直接 reload
					if (self.$store.state.config.CONFIG.LOGOUT_RELOAD) {
						// 設定關閉快速登入介面(防止在登入畫面跳出)
						this.$store.state.status.closeSecurityLock = true;
						setTimeout(()=>{window.location.reload();}, 100);
					}
					// 只登出交易帳號
					else {
						M4C.Trader.logout();
						eventBus.$emit("CLOSE-DIALOG");
					}
				},
			});
		},
		onLoginTrade() {
			eventBus.$emit("POPUP-DIALOG", "LoginTradeMix", {}, {transName: 'float'});
		},
		/** 備兌鎖定與解鎖 */
		onBtnWarrant() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', 'Warrant');
		},
		/** 银期转帐 */
		onBtnBankTransfer() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', 'BankTransfer');
		},
		onClose() {eventBus.$emit("CLOSE-DIALOG");},
    },
	components: {Password},
	watch: {
		suspend(nv, ov) {
			if (ov && !nv) {
				// 畫面上沒有任何帳號時 -> 關閉自己
				if (!this.traderID) {
					eventBus.$emit("CLOSE-DIALOG");
				}
			}
		}
	},
    computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		/** 是否允許登入/切換其它交易帳號 */
		loginMoreTrader() {
			return this.$store.state.config.CONFIG.LOGIN_MORE_TRADER;
		},
		// 當前帳號支持行權功能 (SIM、ntp30305 不支持 )
		supportExercise() {
			return !this.$store.state.login.isSIM && this.$store.state.config.CONFIG.ENABLE_EXERCISE && this.isOptionAcc;
		},
		// 支援三大提醒功能(台灣、SIM、ntp30305不支援)
		supportNotice() {
			return !this.twMode && this.$store.state.login.brokerID !== "IceTech" && this.isStockOptionAcc;
		},
		twMode() {return this.$store.state.config.twMode;},
		// 當前帳號是股票期權
		isStockOptionAcc() {return this.$store.state.login.isStockOption;},
		// 當前帳號是期權
		isOptionAcc() {return this.$store.state.login.isOption;}, 
		/** 已有登入記憶的交易帳號列表 */
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		// 當前帳號支持股票 (ex.個股期權帳號)
		supportStock() {
			let pds = this.$store.state.config.tradePdSetting;
			let tp = pds && pds.broker && pds.broker.tp ? pds.broker.tp : [];
			let obj = tp.find((code)=>{return code % 100 === 5;});
			return !!obj;
		},
		// isStock() {return this.$store.state.login.isStock;},
		isFut() {return this.$store.state.login.isFut;},
		isOption() {return this.$store.state.login.isOption;},
		// 顯示修改密碼按鈕
		displayChangePasswordBtn() {
			return !this.$store.state.login.isSIM;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// 啟用結算單
		enableSettlement() {
			let enable;
			try{enable = this.acPdSetting.broker.enableSettlement;}catch(e){};
			// 未設定預設為 true 向前相容
			enable = enable == null ? true : enable;
			return enable && (this.isFut || this.isOption);
		},
		// 顯示row1的操作按鈕(非台灣版或參數有指定顯示)
		showOption1() {return !this.twMode || this.param.showOpt;},
		// 顯示row1的操作按鈕(非台灣版或參數有指定顯示)
		showOption2() {return !this.twMode || this.param.showOpt;},
    },
}
</script>
 
<style scoped>
.trading-account-manager-ctn {
	padding: 0 10vw;
}
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}

/** 桌機版 */
.desktop .trading-account-manager-ctn {
	padding: 0 38px;
}
.desktop .logined-bto-selector {
	width: 100%;
}
</style>