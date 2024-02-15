<template>
	<div class="posr">
		<!-- 一般閃電 -->
		<div class="config flex-row flex-1 pd1d5 flex-vertical-center" v-if="model=='N'">
			<div class="flex-1" v-if="hiddenSMO" />
			<span class="flex-center flex-1" @click="onOCO(ssps, ssps.$BUYSELL == 'BUY')" v-if="!hiddenSMO">
				<span class="setting mgr2 cbtn oco-btn buy-oco font-size-small" 
					:class="{'disabled': ssps.$BUYSELL != 'BUY' || isStockItem, 'disabled-ui': !isAgreeSMO}">{{$ln('护')}}</span>
			</span>
			<radio v-model="$store.state.thunder.enterType" class="type-radio mgr2">
				<span value="LIMIT">LMT</span>
				<span value="Sm" v-if="isStop">SM</span>
				<span value="Sl" v-if="isStopLMT">SL</span>
			</radio>
			<span class="setting cbtn mgr2 tcef" @click="$store.state.thunder.isMiddle += 1">
				<i class="material-icons setting-icon font-size-normal">reply</i>
			</span>
			<span class="setting mgr2 cbtn flex-center tcef" @click="$store.state.thunder.scrollLock = !$store.state.thunder.scrollLock">
				<span class="icon" :class="$store.state.thunder.scrollLock?'icon-lock-price-on':'icon-lock-price-off'"> </span>
			</span>
			<div class="setting cbtn mgr2 flex-center tcef" @click="onSetting">
				<i class="material-icons setting-icon font-size-normal" >settings</i>
			</div>
			<div class="setting cbtn mgr2 flex-center tcef" v-if="!hiddenSMO" :class="{disabled: isStockItem, 'disabled-ui': !isAgreeSMO}" 
				@click="onBtnEnterStrategy">
				<span class="setting-icon icon-strategy-selector"></span>
			</div>
			<span class="flex-center flex-1"  @click="onOCO(ssps, ssps.$BUYSELL == 'SELL')" v-if="!hiddenSMO">
				<span class="setting cbtn oco-btn sell-oco font-size-small" 
					:class="{'disabled': ssps.$BUYSELL != 'SELL' || isStockItem, 'disabled-ui': !isAgreeSMO}">{{$ln('护')}}</span>
			</span>
			<div class="flex-1" v-if="hiddenSMO" />
		</div>
		<!-- 戰鬥閃電 -->
		<div class="fight-config flex-col flex-1 pd1 h100p flex-vertical-center posr" v-if="model=='F'" v-stop-propagation>
			<div class="setting cbtn bgc-none clr-white tcef" @click="onSetting">
				<i class="material-icons setting-icon font-size-xl">settings</i>
			</div>
			<div class="flex-1 flex-col w100p posr">
				<ScrollBounce>
					<div class="font-size-micro mgt3 mgb1 flex-center label">{{$ln('进场')}}</div>
					<radio v-model="$store.state.thunder.enterType" class="type-radio bgc-none pd0 flex-col rd2 pdtb2 font-size-micro order-type flex-center" :isRecall="true">
						<span class="setting cbtn in-sm clr-gray2" value="Sm" v-if="isStop">{{$ln("停市")}}</span>
						<span class="setting cbtn in-sl clr-gray2" value="Sl" v-if="isStopLMT">{{$ln("停限")}}</span>
						<span class="setting cbtn in-tm clr-gray2" value="T">{{$ln("觸價")}}</span>
						<span class="setting cbtn in-om clr-gray2" value="O" v-if="!isStockItem">{{$ln("擇一")}}</span>
					</radio>
					<div class="font-size-micro mgt3 mgb1 flex-center label">{{$ln('出场')}}</div>
					<radio v-model="$store.state.thunder.protectType" class="type-radio bgc-none pd0 flex-col rd2 pdtb2 font-size-micro protect-type flex-center" :multiSelect="!isStockItem">
						<span class="setting cbtn out-sp clr-gray2" value="STOPPROFIT">{{$ln("停利")}}</span>
						<span class="setting cbtn out-sl clr-gray2" value="STOPLOSS">{{$ln("停損")}}</span>
						<span class="setting cbtn out-ts clr-gray2" value="TRAILINGSTOP">{{$ln("移停")}}</span>
					</radio>
					<!-- 將跳價移到裡面是為了避免太短手機將出場策略蓋在下面情形。 -->
					<ScrollInput v-model="$store.state.thunder.tsiJumpQty" max=10 min=0 step=1 class="font-size-normal mgb2" mode=1 noBtn=true />
				</ScrollBounce>
			</div>
			<div class="flex-col flex-end mgb3">
				<!-- <div class="setting cbtn tcef">
					<span class="setting-icon icon-strategy-selector" @click="onBtnEnterStrategy"></span>
				</div> -->
				<!-- 當沖目前模擬無法測試，需實盤才能委託 -->
				<div class="daytrade pdtb2 font-size-micro" v-if="showDayTrade" >{{$ln('当冲')}}</div>
				<toggle v-if="showDayTrade" v-model="$store.state.order.dayTrade" class="mgb2 daytrade-toggle" :class="{'mgtb5':isDesktop}" :mode="'small'"/>
				<div class="setting cbtn flex-row flex-center sys-bgc">
					<InputQty v-model="$store.state.thunder.orderQty" class="font-size-normal inputQty-ctn" :noBtn="true" />
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import ThunderSetting from "@/components/Thunder/ThunderSetting.vue";
import EnterStrategySelector from "@/components/EnterStrategySelector.vue";

export default {
	data(){
		return {
			isPriceLock: false,
			inputOrderQty:1,
		}
	},
	props:['param'],
	components: {ThunderSetting},
	mounted() {
		this.$store.state.thunder.orderQty = Math.abs(this.$store.getters.getDefaultQty || 1);
		// 進場委託類型在該商品不支援時調整為限價類型
		if(this.orderTypeList.indexOf(this.entryType) < 0 && this.entryType !== "*")
			this.$store.state.thunder.enterType = "LIMIT";
		// 記錄閃電初始設定
		console.log('[Thunder] initial settings', JSON.stringify(this.$store.state.thunder));
	},
	beforeDestroy(){
		if(!this.keepStrategy)
			this.resetOptions();
	}, 
	methods: {
		// 一般平倉OCO單
		onOCO(pos, run){
			if(M4C.SmoAgreement.checkAgreeSMO(true)){
				if(run) {
					eventBus.$emit("POPUP-DIALOG", "StopLoss", pos, {transName: 'float'});
				}
			}
		},
		//跳出閃電設定。
		onSetting(){
			eventBus.$emit("POPUP-DIALOG", ThunderSetting, {model: this.model}, {transName: 'float'});
		},
		/** 進場策略 */
		onBtnEnterStrategy(){
			if(M4C.SmoAgreement.checkAgreeSMO(true))
				eventBus.$emit("POPUP-DIALOG", EnterStrategySelector, "", {transName: 'float'});
		},
		resetOptions() {	
			this.$store.state.thunder.enterType = 'LIMIT';
			this.$store.state.thunder.ocoOrder = [];
			if(this.$store.state.thunder.protectType)
				this.$store.state.thunder.protectType.splice(0);
		}
	},
	computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		orderTypeList() {return M4C.Symbol.getOrderType(this.sid).split(';');},
		isStop(){return this.orderTypeList.indexOf("STOP") != -1},
		isStopLMT(){return this.orderTypeList.indexOf("STPLMT") != -1},
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		model() {return this.param && this.param.model? this.param.model: this.$store.state.thunder.model},
		isStockItem() {
			return this.sid.indexOf('I.S') == 0;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		/** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			try{
				return M4C.SmoAgreement.checkAgreeSMO();
			} catch(e) {
				return false;
			}
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 是否為期權商品
		isOpt() {return M4C.Option.isOpt(this.sid);},
		// 是否為價差商品
		isDiffSymbol() {return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);},
		// 是否顯示當沖
		showDayTrade() {return this.twMode && !this.isOpt && !this.isDiffSymbol;},
		// 進場委託類型(為了比對進場委託按鈕用的)
		entryType() {
			let type = this.$store.state.thunder.enterType.toLowerCase();
			if(type === "sm") return "STOP";
			else if(type === "sl") return "STPLMT";
			else return "*";
		},
		// 記憶進出場策略
		keepStrategy() {
			return this.$store.state.thunder.settings.other.keepStrategy;
		},
	},
	watch: {
		sid(nv) {
			// 切換商品時重設委託設定。
			this.resetOptions();
		},
		'$store.state.thunder.enterType'(nv, ov){
			// 需要勾選雲端洗價同意書才能使用
			if (nv !== 'LIMIT' && !M4C.SmoAgreement.checkAgreeSMO(true)) {
				this.$store.state.thunder.enterType = "LIMIT";
				return;
			}
			if(nv === ""){
				this.$store.state.thunder.enterType = "LIMIT";
			}
			if(ov === "O"){
				this.$store.state.thunder.ocoOrder = [];
			}
			// 記錄進場設定切換
			console.log('[Thunder] change enterType', nv);
		},
		'$store.state.thunder.model'(nv){
			this.resetOptions();
		},
		'$store.state.thunder.protectType'(nv, ov){
			// 需要勾選雲端洗價同意書才能使用
			if (nv.length>0 && !M4C.SmoAgreement.checkAgreeSMO(true)) {
				this.$store.state.thunder.protectType = [];
				return;
			}
			// 止盈與移動停損不能共存
            if(nv.indexOf("STOPLOSS") >= 0 && nv.indexOf("TRAILINGSTOP") >= 0){
				// 當SL與TS同時存在時記錄
				console.log('[Thunder] change protectType before SL && TS', nv.toString());
				// nv.pop();	// 不循環方式
				// 循環方式
				let newType = nv.slice(-1)[0];
				if(newType == "TRAILINGSTOP")
                    nv.splice(nv.indexOf("STOPLOSS"), 1);
				else nv.splice(nv.indexOf("TRAILINGSTOP"), 1);
			}
			// 記錄出場保護設定切換
			console.log('[Thunder] change protectType', nv.toString());
		},
		"$store.state.order.dayTrade"(nv) {
			// 記錄當沖設定切換
			console.log('[Thunder] change dayTrade', nv);
		},
		"$store.state.thunder.settings.enter.stopOrderType"(nv, ov) {
			this.$store.state.thunder.enterType = this.$store.state.thunder.settings.enter.stopOrderType;
		},
	}

}
</script>
<style scoped>
.config {
	background-color: #484C4F;
}
.fight-config .setting {
	margin-top: 1vw;
	margin-bottom: 1vw;
}
.fight-config .type-radio .setting {
	margin: 2px 0;
	padding: 2px;
	color:white;
	box-sizing: border-box;
	border-width: 1px;
    min-height: 8vw;
    width: 100%;
}
 .type-radio .setting.focus {
	 border:1px solid rgb(255, 152, 0);
	 color:rgb(255, 152, 0) !important;
 }
.setting {
	color: rgb(255, 152, 0);
	/* padding: 4px; */
	border-radius: 4px;
	box-sizing: content-box;
    height: 24px;
    width: 24px;
}
.icon{
	width: 1.3em;
	height: 1.3em;
	display: block;
}
.oco-btn{
	color: rgb(255, 152, 0);
	font-weight: bold;
}
.buy-oco{
	min-width: 1.5em;
	color:initial;
	background-color:#FFAEC9;
}
.sell-oco{
	min-width: 1.5em;
	color:initial;
	background-color:#B5E61D;
}
/* 鎖定價格 */
.icon-lock-price-off {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwVJREFUeNrsnc1x2zAQRmGPCtCkAuWai5UOpArsVBC7giQNJHIaoFWB5AosV0ClAjmXXK0KMiohC2cPnMzIIbEAQVLvzWDogwcSvw+7+CMh5wAAAAAAAAAAAAAAknPW9gf+/vpuLJeplJmUCylj/bvrzN98/7WNXemoJdEncrmSctkTsVtjlFh4L/YnFb9r1GnNU43QfhkgwnvBCymTrrY8SSfzGvdRpo7YUWThpyo8aaYm5xHFX8hlh/gtR4B2sA+aL6HNCNBOdof4GQwQ8a/lUqYeJZCCjou/6vONa/T+j3HnDBiC+ErZuxSkrWbloP0IqIx22pidHqT87JhW+9wp6CFBTtxIefTCy8x0TwS8PsmKNdT0rXspZX2qolc5qyH+VMf6MbiTcivCH8j+9SOgiJQ/b1Kspw/aAF3VnBk/48n93cyg1QcMQwvEz2SAtv4J4ueLgI/GnI/4oaMgnXQ9G+qd0+HaIsCyh3uH+HYDQtOPTzm3yGowoPLcTghL8r49Aizj/jWS2g0Ibf0b1nbiGHARWNcjcsYxIHTyxcgnYwo6kH7iz4SbLjtARgOACCACIKMBPJpIBBABEMmAkA51rHsIEMGA0AnVDDnjGBD6SOAlcuZLQZ4r0lAcA7aG+q6RtBnHNuVDXzvyu2Fv2RWzD0PvA+vz25nfkNVuwMZQ5+ear//AMQN0bd9iwko398EwE14a6vWjoRITAjvhSmf87Hg+NFsEeL4Y658SCQYDpOVunH2z/eUNGzrmsAiIEQXVPqEgGhr0AZW+YBFxfM9Lek0NMM6OX+PkX1NtYoBPIzuX9vyEan/zo2NaJYnYRqcmakdanmi2SPLSSaMtSf0CN3Sd8Wh8WoqYsJZIeFlu6HuLrvE/hUu83x10XtAQTKiTTuQek8/gzw03sNZWxDJDDgMqrei949HEPAaoCXsp3gRezsthQMWIhUbDFlkzGKAmPOmRwB9cohOmTnYmHMLADu9OMhFr5fcDBnJ8fX8N+McMfsABAAAAAAAAAAAAAKBd/ggwAAXd747dRqFeAAAAAElFTkSuQmCC");
	background-size: 1.3em;
}

.icon-lock-price-on {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA6BJREFUeNrsnd9t2zAQxhlDAwhdIH7uS+wJKk8Qe4LaEyRZoKm7gO0J4kxgewLJEyR96Ws9QeEN2iN8DAShkiiSEiX5+wFEjESgrO94x+MfMUIAAAAAAAAAAAAAAAAAALVz0/QN/3z7HNKPEZWIyh2VkD+3ncmnH7+SnGeS3z9O/WpJ137XqTRoSPQh/ZhSue+I2I0R1Cy8FPuBxW8bicY1I/bQbhmAhJeCr6gM29ryKERMNJ4jrttjA8fCj1h4hBlNBg7Fl53OG8Rv2AO4g91xvARNegB3sm8Q34MBSPw5574hZGw4BLH4L11+cPbeMsLWGaAP4jNx50IQt5oXAZr3gFS208To9EzlZ8u0OvkOQbsaYuKeykEKTyPTEzygeJDlKtWUrXtDZXutolcyAE8vPDu631pcpmrPiP76HrByFD8XefPp18xNSeufOuh438VlMaPTrZ7DcB63VOaZZOJYcP1H+A1qbv29EJ+pEoYjUTwpmaisalDS+ocQ318f8NUy5vdZ/FPFcUGYl0UGBYMum2XERc9b/qvuontqBiGuMhVhI/4a2Y4+A8fhR7b6JWS1MEBq344JG3S69h4QWdS3haT2BjBt/XvM7bgxwJ1hXQfI6cYApoMvZD4eQ9AZ4cdtGmoy7QA8GgDAA+ABwKMBsDURHgAPAI4MYNKhhryGABwYwHRAFUFONwYw3RJ4Dzn9hSDJFGHIjQESi/rmkNTSALyiZeoFD7yiBizT0FfD+qT4z5BVn7x9QXLbuOmuuEfygkPPd0Z8KdmqmOU27w+5e0PpBnJPqOn2FJnKjvu0QE96/HVY3cfBH0Uj4Y3FDWQ2FKM/sJiKYAudLOoewQjmfYDiSdhtT1dG6MM+0WVJjJ9nUvljSYgu7gNSsc/FiSHyhr19QcPmwCad2dAnB99R9QkrhKSKBiBLvgt3+z0fqfyWKRymLfQ9QLA7uVr3VYM1aYidfPP+mo1R5T3hmbicjOIyhEzVWIOMoDovxbFlWtXyWq22AeTNSaSZqPeMhSjncxuwTcvNQ1BmbLBA5PYTgpQRthwuun5ox0TjmpWoeb3b6LygPhhBZ0xCz1j74HFg8QBbbkV4I8aHAVKtaCywNdGPAVR2RGUs8HKeHwNkBmtjgRc1/BhATVvwkcAzUdMJU1efhmoaQi5p7tt8eDfP8pYx6qQBMp100tLj66PeesD/OmpxOS1r3eF/4AAAAAAAAAAAAAAAAAAAdJV/AgwAyEAl87gUsesAAAAASUVORK5CYII=");
    background-size: 1.3em;
}
/* 返回中間價格 */
.icon-back-price {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABDpJREFUeNrsXNtR40AQXLscgOsSOPHLz0EE2BEAEWBHAE6AxyUAjkAmApsIJCKw+blfdAlQCuF2z+M6w+mxj1nJkrqrtlRgySV3z8zOjLQrBAAAAAAAAAAAAFApejonfdweT+ThTI6gxVy80jGWY/Pt56+0dgEk8UN5WMox6qBxJnKs5HiWYmzqEiDqKPlZYjzL8cTtGb0C8hXxEbj/BEX+nFOIfsFnV+D7P6iQfCfHuzTQC98CBOC7UIilFGFJ86QXAYByKC9YSxFOfAiQgF8tqEgRUarOKsAruDUKSaGNCGVp6FoeTsCvEaYyQ1pwzQFjVRWCUyOEJnOCbiviRh7OWxw+uL1c1Qin0hMSFgG6AEonVfF5RtmNaxqu+kmnEMBeECXCtXBrxTxIEe4hgLsQIYUqGxwVhSIUYiWQ5KmO6JHYdkatJmV4AJ83KDJtCq6xFDKGB7h7w1TFdYtL7+AB9XtCphfAA+w9wbRAvUII4sUlFVy6mGS1riGAvReo1HJueNkFBOAVQRVZicEl5xCAH3N4QL1YGGZQIwjAG4ZSQxEggAeYPD38DgH4ERucG0AAPympbjaEEOQJic1FEAACtAa/IUADAQEgQGvwAwLUiyEEqBe6L3elEIAZH7fHgYEHbCoV4Gv3r6Uw+Y2f6oWBJ9KVOz7ubkz+rQ6xHDOfKw5rhMl7s29ePYAsfp1hFX//z7W26sDCj8lvir0JQJa/LDktdF1XdWCYGJybfo0AfWbyI43JaCjs3i47ROtXv+Xa4JKVlzSU3FCHfJuYeci4M8z/X9kF2NvOoE1hRdfjb0zCD7sHEPmR6Ng6sj2jM8Eqa3V9vybyk4ZroMgPDK954G5FPDpY/rzB1h8K81Uzcd4ijYHDTdhmMk9NLMbI40PDnH+HWd4H/YrJX0jyZw2dcCNL8hdFBjcwvJGJA/kreq27aVZ/IwoWWGhkPoUGNzAkP7S8EWUB0wYRH5ChXTum17OyfYV6FZE/rmoPNgfCA/FvnfCI4WuVx1+WndTTuDkV/9YC8GJ0PQ3yI9GxKtcRKZGvlen1QH595OcKQLP/O8j3S35mHbDXYgD5nsnPK8Q611xjmHCPbKv7rDpg7pBydg2lu6HYzgGq+nsEv7mIBdMLBkVZkEvPp61IyOoXXF9YVgdABKpqxXYT7xX3F+tUwl0UIaUw8yJynmRxQacZN6OsyDYz2tAPaQLp6l4Tnc32KvOAL7WBrQhTzrjZJmjvF8QgwmlLX0usRgASIRDbzujQ0sXHEMFBABLBpUmXUtWYgvr8VkQhyILHwmyzoh12j/gAWwH2RLB9xHgO2h0FIBFWliKg0cchAImwEA162N46AfZEMNlLE1kQpwAkwr3Q37ToGbQzC0AiTDVESIThFl8QgE8EFXouUQM4FmKaxdpIbHeKDaheeEEvCAAAAAAAAAAAADgI/BFgAOVyayLI/utCAAAAAElFTkSuQmCC");
	background-size: 1.3em;
}

/* 閃電鎖定 */
.icon-lock-all {
  background-image: url("data:image/png;base64,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");
  background-size: 1.3em;
}
.fight-config .type-radio {
	height: auto;
	border-radius: 0 !important;
}
.type-radio{
	border: none;
    background-color: white;
    color: gray;
    border-radius: 2vw;
    height: 8vw;
}
.type-radio span {
    padding: 0 1vw;
	height: auto;
}
.type-radio .focus{
	color: white;
    border-radius: 2vw;
}
/* 進場策略 icon */
.icon-strategy-selector {
	width: 16px;
	height: 16px;
	display: block;
	background-size: cover;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAvCAYAAABTy8xRAAAAAXNSR0IArs4c6QAABbBJREFUaAXtWl1sFFUUvmdmbHemJaUEoZgilXa3NATC7golPmlEY4iiIF3aPmgfTEQJJqY+GMODT0ai4aH+J4qEmG5dKUjUxBhTjUYSQawPEti20RgJsSGibenM7Dozx3NXl0y3u93Z7c7OkHSSydy599x7v++bc/8H2E124SehlSnViqLJIshYlOCvlNc074B7vjbKoSKVk6laefDk5lWptB5FxCgyK0L1RtUZ8/Y59QtwoFzyvBzfCICJjU0pMx1FILJIXxZZRNVnm+eQzX0BNqmsbj7K2ERuiuN3TwXA0+3LtFnzODLsVA19TQY1+bXTC1A4Ql9fd2qfz07IF1mtOHg4OcMEOEP1/Ue+tIr/kuuEt0rLMt/aUwE4HKV7/BUAOD0fWrEYeC0jYDGzIumeC8DxyYH6PmDwSxGsN5LJdlYJSAM3IhYR8IUAsPunvyVge8kTUo64COxt2HPpT0e2RYx8IQDHWNMzMUojwDNF8DIuEqJ4pJid03TfCEBjPQgMmooBB8RjdT3JK8XsnKaDU0M37fDTTY3qtPoB1bGT2vdlel6noXFDbp0AzARRCsqx5K+5aeW+e+4B6URwizat/UAEdhLBEVliEUESHyEhZuaTgnglyfPyPRVAGww9bpjWGfra66ltH5bFyP0Qm7gaiCWThO0JuwAkDorIXrbHVSLsSROgaW+NbugDFmNPMgbTAEKf0jN2KpeQOhQcQMs6yOPJIz5Weid259os9r3qHqDGW9dqRurbDHmAC6Igbc1HnhOThZrnyDO+52EUhJf4s9JXVQXQPwztoM7+R3L5beTScWWF0hnovjRWiBTELqRBrI2Rmw7VdY+dK2Tn+3g+xGnxthfUwVZTHWxLq/Fg0fHeTgrxRdc+lOt9ACaiDZo5dZxE2EXufIUJYkzZl/zOTtDLsKsCpBIbNpmmcZLIt1En9o3MAjHo/XnSS8K5dQO55BvUxfLdlopfRJxPZpbzgqnN01gPZW1bVRzY/wXSZsjTdLONBHS7W5Vky6VdnjupL8+++uJpAjT4AsgSiCUFlhRYUmBJAY8UAFqcDNPgdJdr9SMtuYHR2sd/F4iwRyLyMwzhmhvwaJopZHZ2qBKaBqdpLlD+EY4LANESDFenwhyzOtTWRd//PRJiGYnwuizW9vNVngt8yirSdQE4Kv1ER9D8J32CJoKbaUp8DmpquuRHL/5WFuIKZ3JtmWnHGdh7cVwRV22ndnCUmsFWK5Ue1YeCD9ptCoXxq7sldSjUXSh9sfFV8QA7SC0e7KOj7jcpLkB9z2FZCh+C2Eem3cYepib0KkN8Shahhe8X2tMqEa6KB9iByj3jx0Txlk6KG6d+4XnNGB3B4Y68h6O8/0AL+8lrFM1k/fZyKhWuugdkgWeOxlXzXVqJxmiYnBRQ6pV7kyPZ9NRQsMNEPEvp9TyOOtDr1IGuow60oiNW1T0gS5Cf7Co9E/voOOggbZY0IhhfUPM4RISBi2Na1qkseZ6Hh1VTfzabv1JPzzzATkBNhLYxw0zQdGEdferPCRTNGXCX3SYTBjaliMvJC85PzUsrM8IzD7DjVWJjZ2UpEKGm8Bl96gfykucZkDXo5nRJG6r2evKFfeEBWWBaPHSvheaX2fe8T4BriiK2VOLnCF6+LzyAA1GH25otZsV5eMELcYWumQcWtCkh0RcewI/K+GkRPzBxhB3gqlLf0AIPnVcd2S9g5AsP4OeEjslzMoi3arNT+xfg5TjJcw/gM0MLrfcdI84aAvtDaVp7x039mxwf76nHf4wWSKW7MrImbfL3OUfoWW1KeXruARwsJrrENBttt4zM/79hflBDwmyhpMyhSiFCNIG6LEu1rYtZXvtCgEIE9eHQesvAMK0H+MkV3RimucDqOfaCsL+ue/ydOXElvPhagHw8ZuPtt4nMCtOskf4Wt8K0SmiUm5rvK/eH6X8B5gP1MBumo5YAAAAASUVORK5CYII=');
}
/* 閃電所有按鈕調整一致大小與弧角 */
.cbtn {
    width: 8vw !important;
    height: 8vw !important;
    border-radius: 2vw !important;
}
.inputQty-ctn /deep/ input{
	height: 7vw !important;
}

.bgc-none {background: none;}
.pd0 {padding: 0;}
.fight-config .type-radio > span {
	border: 1px solid gray;
}
.fight-config .type-radio [class*= "in-"], .fight-config .type-radio [class*="out-"] {
	background: none;
	border-radius: 2px !important;
}
.fight-config .type-radio .out-sp.focus {background-color: #3399FF; border:none; color:white !important;}
.fight-config .type-radio .out-sl.focus, .fight-config .type-radio .out-ts.focus {
	background-color: #9933FF; border:none; color:white !important;
}
.fight-config .label{
	text-decoration: underline;
    text-underline-offset: 2px;
}
.desktop .fight-config {
	background-color: #111820;
}
.desktop .fight-config .type-radio {
	width: 2.25em;
	border-width: 0;
}
.desktop .config {
	overflow-x: auto;
}
.desktop .config .type-radio {
	overflow: visible;
}
.desktop .config .type-radio>*{
	padding: 0.5em;
}
.desktop .type-radio .focus{
	border-radius: 0;
}
.desktop .fight-config .type-radio .setting {
	min-height: 2.25em;
}
.desktop .config .buy-oco {
	background-color:#FFAEC9;
}
.desktop .config .sell-oco {
	background-color:#B5E61D;
}
.desktop .cbtn {
    width: 2.25em !important;
    height: 2.25em !important;
	border-radius: 0.5em !important;
	background: none;
}
.desktop .cbtn:hover {
	color: aqua;
	background-color: #555;
    cursor: pointer;
}
.desktop .inputQty-ctn /deep/ input{
	height: 2em !important;
	width: 2em;
}
.desktop .fight-config .setting{
	margin: 0;
}
</style>