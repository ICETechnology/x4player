<template>
	<!-- 實虛/剩餘天數 -->
	<div class="position-card-extraInfo flex-row flex-center font-size-micro">
		<span v-if="psd && realVal != null" class="icon-btn rd1 flex-center pdlr1 mgr2" :class="{'not-real': realVal < 0}" @click="onClickRealVal">{{$ln(realValText)}}</span>
		<span v-if="psd && psd.$IS_COMPOSITE" class="icon-btn rd1 flex-center pdlr1">{{$ln(`组合`)}}</span>
		<div if="hideTotalMargin" class="flex-1" />
		<div v-if="showMargin && !hideTotalMargin" class="flex-row flex-end flex-1 mgr4">
			<span class="icon-btn rd1 flex-center pdlr1">{{$ln(`保`)}}</span>
			<span class="pdl2">{{$commas(Number(psd.TOTAL_MARGIN))}}</span>
		</div>
		<div class="flex-1" v-if="!showMargin"/>
		<div v-if="displayExpire" class="flex-end pdlr1 rd1 clr-gray">
			{{displayExpire}}
		</div>
	</div>
</template>

<script>
export default {
	props: ['sid', 'psd'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 點擊虛實值icon */
		onClickRealVal() {
			event.stopPropagation();
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln(`${this.realValText}期权`),
				content: `${this.$ln('虚实值：')} ${this.realVal} ${this.$ln(`(${this.realValText})`)}`,
				confirmOnly: true,
			});
		},
	},
	watch: {},
    computed: {
		/** 剩餘有效天數 */
		remainDays() {
			return M4C.Symbol.getRemainDays(this.sid);
		},
		expireDay() {
			let dateObj = M4C.Symbol.getExpireDay(this.sid);
			if (dateObj)
				return dateObj.day10('-');
		},
		/** 標的商品QO */
		qoS() {
			if (this.psd && this.psd.$UNDERLYING_S)
				return M4C.Quote.getQuoteObject(this.psd.$UNDERLYING_S);
		},
		/** 實虛值 (期权only) */
		realValText() {
			return this.realVal >= 0 ? '实值' : '虚值';
		},
		/** 實虛值 */
		realVal() {
			if (!M4C.Option.isOpt(this.sid))
				return;
			let qos = this.qoS;
			if (qos) {
				// 依卡片https://trello.com/c/aOTE1cfR 描述調整標的價格取值處理
				let underlyingPrice = qos.c || qos.p || qos.pc;
				let strikePrice = M4C.Option.getStrike(this.sid);
				if (underlyingPrice && strikePrice) {
					if (this.sid.indexOf('.C.') != -1)
						return +Big(underlyingPrice).minus(strikePrice);
					else
						return +Big(strikePrice).minus(underlyingPrice);
				}
			}
		},
		/** 顯示用逾時文字資料 */
		displayExpire() {
			if (this.expireDay) {
				let $ln = this.$ln;
				return `${this.expireDay} ${$ln('到期')} / ${$ln('剩馀')} ${this.remainDays} ${$ln('天')}`;
			}
		},
		$commas() {return this.$store.state.fn.$commas;},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
		// 是否顯示保證金(依設計有義務倉時，顯示占用保證金)
		showMargin(){
			return this.isOpt && this.psd && this.psd.$SQTY;
		},
		// 隱藏佔用保證金
		hideTotalMargin() {
			try{return this.$store.state.config.publicPdSetting.CONFIG.TW.hideTotalMargin;}catch(err){}
		},
	},
}
</script>

<style scoped>
.icon-btn {
	color: rgba(245,137,35,0.54);
	border: 1px solid rgba(245,137,35,0.54);
}
/* 虚值样式 */
.icon-btn.not-real {
	color: #A2A2A2;
	border: 1px solid #A2A2A2;
}
.icon-clock {
	width: 5.2vw;
	height: 5.2vw;
	background-size: cover;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAglJREFUOBGtVU1ME0EU/qbblpZLQWIaaCFA+JMQm+iFkxgTYjgYIzdOmBg5eMILJ45c4NSTV+GiNw/WeFAheMIYJZQQA00jyI8NRn4qiYVtN+O8MW1ndtewCb7Lvnnfz7zZnbxlEJEOx+Iw2QznuAnwRqp5D5ZjDIsI8olEYW+XSbMzlubgl7ybOJkM7BA1POGTnV3QjOxlQ+KU/r/HdNkxGETDo1FE7gwi2NEqCWZ2C/nUWxw8mQM3TYeIvNiKL8btSPj6VbTMJhHq7bJDcn36JYPt++MofF514A7D2v5r6Hj/Aszvd5DVAi+VkB0Yxu8Py2oZPnXFQiE0P006zNav3EBhbV2lSo7kCo0amuHlxw8R6mpXcZmfZb6i9OOno05c0qihGUbuDamYp9yu0V5UTWfbP00Kn8QHKFnwN0UR7uup8OwazRCGUSGqSaC5CbnJaVmqFTegcylVhW0azdDc3NZ2L6t6tz6WU8eTNGpo7/DXq3cq5im3a7R7aNRF0L22gEBj1JNZMbePjb5bsI7zFb7WIQE7YxMV8LyEuKoZ8TVDKpy8nsfm8AMUXe4d4RSEEYe49hBHjn93m4FGQz2ik+OI3L2NQEtM6orfdpF/+Qb7U0lYB0d2L7EWszFtxJ9xzkdc0GqpfDUsq1pzyRhjz///gKWxTZOW3Klll43PKdEvQGiFB3n9AZB/srcmaK8bAAAAAElFTkSuQmCC');
}
</style>