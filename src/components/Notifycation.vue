<template>
    <div class="notifycation-ctn font-size-small">
		<transition-group name="list-complete" tag="div">
			<NotifycationCard  v-for="(obj,idx) in cardList" :key="obj.key" :obj="obj" @close="closeCard"/>
		</transition-group>
    </div>
</template>

<script>
import NotifycationCard from "@/components/NotifycationCard.vue";

export default {
	props: [],
	data() {
		return {
			cardList: [],
		}
	},
	beforeMount() {
		this.$store.state.notify = this.notify;
		this.$store.state.notifyClose = this.closeCard;
	},
    mounted() {
	},
	beforeDestroy() {},
	components: {
		NotifycationCard,
	},
    methods: {
		/**
		 * param.icon : 指定的圖示
		 * param.head : 標題文字
		 * param.body : 內容文字
		 * param.keep : 欲更新同個 notify 上的情境時才需要帶，例如回報
		 */
		notify(param) {
			// 支持純字串模式
			if (arguments.length === 1 && typeof(param) === 'string')
				param = {body: param};
			// 支持2個參數情境 (type, body)
			else if (arguments.length === 2)
				param = {type: arguments[0], body: arguments[1]};
			// 支持3個參數情境 (type, head, body)
			else if (arguments.length === 3)
				param = {type: arguments[0], head: arguments[1], body: arguments[2]};

			// 檢查本次要提示的內容，是否已經有了 (相同內容不要再跳提示)
			let existObj = this.cardList.find(obj=>{
				return this.$ln(obj.head) === (this.$ln(param.head) || '') && (this.$ln(obj.htmlBody) === (this.$ln(param.htmlBody) || '') || this.$ln(obj.body) === (this.$ln(param.body) || '')) ;
			});

			let obj;
			// keep 表示可繼續被變動的提示卡，有帶入時不再彈出新卡
			if (param.keep && param.keep.$NOTIFY) {
				obj = param.keep.$NOTIFY;
			}
			// 若要顯示的內容已經在顯示中了 -> 延長該卡的顯示時間就好，不要跳新卡
			else if (existObj) {
				obj = existObj;
				if (obj.killTimeout)
					clearTimeout(obj.killTimeout);
				obj.killTimeout = setTimeout((pm)=>{
					pm.self.closeCard(pm.obj)
				}, param.delay || 3000, {self: this, obj: obj});
				return obj;
			}
			else {
				obj = {key: "".random()};
				this.cardList.push(obj);
				if (param.keep)
					param.keep.$NOTIFY = obj;
			}
			this.$set(obj, `type`, param.type || '');
			this.$set(obj, `head`, this.$ln(param.head) || '');
			this.$set(obj, `body`, this.$ln(param.body));
			this.$set(obj, `icon`, param.icon || obj.icon || (param.type==='error' ? 'error' : 'message'));
			this.$set(obj, `time`, new Date().time8());
			if (param.htmlBody)
				this.$set(obj, `htmlBody`, param.htmlBody || '');
			obj.param = param;
			obj.onclick = param.onclick;

			// killTimeout 理論上應該放在 NotifycationCard，但是目前寫在這邊看起來比較簡單一些
			if (obj.killTimeout)
				clearTimeout(obj.killTimeout);
			obj.killTimeout = setTimeout((pm)=>{
				pm.self.closeCard(pm.obj)
			}, param.delay || 3000, {self: this, obj: obj});
			return obj;	
		},
		closeCard(obj) {
			if (!obj) return;
			clearTimeout(obj.killTimeout);
			if (obj.param.keep)
				delete obj.param.keep.$NOTIFY;
			this.cardList.splice(this.cardList.indexOf(obj), 1);
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.notifycation-ctn {
	position: absolute;
	top: 1vw;
	left: 1vw;
	right: 1vw;
	z-index: 9;
}

.list-complete-item {
	transition: all 0.3s;
}
.list-complete-enter, .list-complete-leave-to {
	opacity: 0;
	transform: translateX(-100%);
}
.list-complete-leave-active {
	position: absolute;
}

/** 桌机版 */
.desktop .notifycation-ctn {
	top: auto;
	left: auto;
	right: 2px;
	bottom: 2px;
	z-index: 99;
}

.desktop .list-complete-enter, .list-complete-leave-to {
	transform: translateX(100%);
}
</style>