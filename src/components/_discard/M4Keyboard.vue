<template>
	<div class="wrapper" :class="!closeM4K?'show-index':''">
		<div class="mask">
			<transition name="show">
				<div class="v-keyboard" v-if="isKeyboard">
					<div class="head" v-if="this.type!='simple'">
						<span v-touching v-for="(k,idx) in flagprice" :key="idx" @click="doFlag(k)">{{$ln(k.t)}}</span>
					</div>
					<div class="body">
						<div class="operator">
							<span v-for="(k,idx) in operatorkey" :key="idx" @click="doOperator(k)">{{k}}</span>
						</div>
						<div class="operand">
							<span v-for="(k,idx) in operandkey" :key="idx" @click="doOperand(k)">
								<i class="material-icons">{{k.t}}</i>
							</span>
						</div>
					</div>
					<div class="foot" v-if="this.type!='simple'">
						<div>
							<span>{{$ln('涨停')}}{{qo.bp1}}</span>
							<span>{{$ln('跌停')}}{{qo.sp1}}</span>
						</div>
						<span>{{$ln('最小变动价位')}}{{tsi}}</span>
					</div>
				</div>
			</transition>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {
			sid: "",
			cid: "",
			type: "",
			tsi: 0,
			qo: M4C.Quote.getQuoteObject(this.sid),
			isKeyboard: false,
			closeM4K: true,
			showValue: "",
			initVal: "",
			flag: "",
			flagprice: [
				{ t: "最新价", c: "latest" },
				{ t: "对方价", c: "count" },
				{ t: "市价", c: "market" },
				{ t: "排队价", c: "queue" },
				{ t: "超价", c: "over" }
			],
			operandkey: [
				{ t: "backspace", c: "delete" },
				{ t: "add", c: "add" },
				{ t: "remove", c: "sub" },
				{ t: "keyboard_hide", c: "close" }
			],
			operatorkey: ["", ".", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
		};
	},
	watch: {
		isKeyboard: function(newv) {
			if (!newv) this.sid = "";
		},
		sid: function(newv, oldv) {
			// if (oldv) M4C.Quote.unsub(oldv, this);
			// if (newv) M4C.Quote.sub(newv, this);
			// this.qo = M4C.Quote.getQuoteObject(newv);
		},
		showValue(newv,oldv) {
			if(newv)
			eventBus.$emit("SET-M4K-VALUE-" + this.cid, {
				v: newv,
				f: this.flag
			});
		}
	},
	beforeDestroy() {
		M4C.Quote.unsub(this.sid, this);
	},
	mounted() {},
	methods: {
		getShowValue() {
			return this.showValue;
		},
		showKeyboard(param) {
			this.sid = param.sid ? param.sid : "";
			this.type = param.type ? param.type : "";
			this.initVal = param.initVal;
			// this.showValue = param.initVal;
			this.cid = param.cid ? param.cid : "";
			this.flag = param.flag ? param.flag : "";
			this.isKeyboard = true;
			this.closeM4K = false;
			if (param.sid) {
				//由於M4K的參數不是由props響應式帶入，所以要在啟動的時候訂閱及getQo
				M4C.Quote.sub(this.sid, this);
				this.qo = M4C.Quote.getQuoteObject(this.sid);
				this.tsi = M4C.Symbol.getTickSize(this.sid, this.qo.p);
			}
		},
		close() {
			let self = this;
			this.showValue = '';
			this.isKeyboard = false;
			//移除最外層摭罩
			setTimeout(() => {
				self.closeM4K = true;
			}, 400);
			M4C.Quote.unsub(this.sid, this);
		},
		onQuote(quote) {
			if (quote.sid !== this.sid) return;
			this.qo = quote;
		},
		doFlag(flag) {
			this.showValue = this.$ln(flag.t);
			this.flag = flag.c;
		},
		doOperand(operand) {
			let self = this;
			let value = self.showValue !== '' ? self.showValue : self.initVal;
			let tsi = !self.type ? self.tsi : 1; //簡易版鍵盤時單位為1			
			switch (operand.c) {
				case "delete":
					if (!self.flag ) {
						// let value = self.showValue !== '' ? self.showValue : self.initVal;
						let price =	value.toString().substring(0, value.toString().length - 1) || "0";
						if(price <= 0){
							price = (!self.type)? 0 : 1; 
						}						
						self.showValue = price.toString();
					}
					else if(self.flag){
						//有旗標價的話重設為現價，並移除flag;
						self.resetFlag();
					}
					break;
				case "add":
					if (!self.flag) {
						let price = Big(value).plus(tsi).toString(); //相加
						self.showValue = price;
					}
					else {
						//有旗標價的話重設為現價，並移除flag;
						self.resetFlag();
					}
					break;
				case "sub":
					if (!self.flag) {
						let price = parseFloat(Big(value).minus(tsi)); //相減
						if(price <= 0){
							price = (!self.type)? 0 : 1; 
						}
						self.showValue = price.toString();
					}
					else{
						//有旗標價的話重設為現價，並移除flag;
						self.resetFlag();
					}
					break;
				case "close":
					// self.close();
					eventBus.$emit("CLOSE-M4K");
					break;
				default:
					break;
			}
		},
		//重設flag並將價格設為現價
		resetFlag(){
			this.flag = '';
			this.showValue = this.qo.p;
		},
		//執行數字(0-9)及.的處理
		doOperator(key) {
			if (!this.flag) {
				//輸入為0且是簡易版時
				if(key === "0" && this.type){
					//初次設定顯示數字為初始值append 0;
					if(this.showValue === '')
						this.showValue = this.initVal.toString() + key;
					else
						this.showValue += key;
				}
				//正常輸入數字(0-9)的處理
				else if (key && key !== ".") {
					if (this.showValue === "0")
						this.showValue = parseFloat(this.showValue + key);
					else this.showValue += key;
				//輸入為.時的處理
				} else {
					//簡易版不處理小數點
					if (this.type) return;
					//正常版處理小數點(只處理第一個小數點)
					if (this.showValue.toString().split(".").length < 2)
						this.showValue = Number(this.showValue).toString()+key;
				}
			} else {
				if (key) {
					this.flag = "";
					this.showValue = key;
				}
			}
		}
	}
};
</script>
<style lang="scss" scoped>
$key_h: 2em;
.show-index {
	width: 100%;
	display: flex;
	flex-flow: column-reverse;
	z-index: 10;
}
input {
	text-align: center;
}
.head {
	@extend .flex-item;
	justify-content: space-around;
	align-items: center;
	text-align: center;
	background: none;
	padding: 0 5px;
	// padding-top: 5px;
	> span {
		@extend .flex-item;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		border-radius: 1px;
		padding: 5px;
		border: 1px solid rgb(215, 215, 215);
		height: 70%;
		width: 100%;
		&:active {
			border: 1px solid black;
		}
	}
}
.v-keyboard {
	color: black;
	width: 100%;
	background-color: rgb(215, 215, 215);
}
.body {
	@extend .flex-item, .flex-row;
}
.key-style {
	@extend .flex-item;
	flex-wrap: wrap-reverse;
	align-items: center;
	justify-content: center;
	margin: 0 0 1px 1px;
	min-height: $key_h;
	position: relative;
	overflow: hidden;
	-webkit-transition-duration: 0.4s; /* Safari */
	transition-duration: 0.4s;
	&::after {
		content: "";
		background: #b1b1b1;
		display: block;
		position: absolute;
		padding-top: 200%;
		padding-left: 350%;
		opacity: 0;
		transition: all 0.8s;
	}
	&:active:after {
		padding: 0;
		margin: 0;
		opacity: 1;
		transition: 0s;
	}
}
.operator {
	@extend .flex-item;
	flex-wrap: wrap-reverse;
	justify-content: space-around;
	align-items: center;
	text-align: center;
	padding: 5px;
	padding-right: 1px;
	width: 75%;
	> span {
		@extend .key-style;
		flex: 1;
		background-color: rgba(255, 255, 255, 0.8);
		min-width: 32%;
	}
}
.operand {
	@extend .flex-item;
	justify-content: space-around;
	align-items: center;
	text-align: center;
	padding: 5px;
	padding-left: 0px;
	flex-wrap: wrap;
	flex: 1;
	> span {
		@extend .key-style;
		background-color: rgba(240, 240, 240, 0.8);
		width: 100%;
	}
}
.foot {
	@extend .flex-item;
	justify-content: space-between;
	padding: 5px;
}
.mask {
	overflow: hidden;
	width: 100%;
}
.show-leave-to,
.show-enter {
	transform: translateY(100%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave-active,
.show-enter-active {
	transition-duration: 0.3s;
	transition-property: transform;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-leave,
.show-enter-to {
	transform: translateY(0%);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.keyboard-h {
	padding-bottom: 212px;
}
</style>
