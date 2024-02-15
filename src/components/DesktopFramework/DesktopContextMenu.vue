<template>
    <div class="FULL desktop-context-menu-ctn font-size-mini" :class="{hidden: !param}">
		<div v-if="param">
			<!-- 遮罩 -->
			<div class="FULL desktop-context-menu-mask" @click="onMaskClick" @contextmenu.prevent="param = null" />
			<!-- 第一層 contextmenu 容器 -->
			<div class="desktop-context-menu flex-col pdtb3" :style="{top: c1top+'px', left: c1left+'px'}" ref="menuCtn">
				<!-- 選單 -->
				<div class="item w100p" v-for="(obj, idx) in param.list" @click="onItemClick(obj)" @mouseenter="onMouseEnter(obj, idx)"
					:class="{'pdtb2': !obj.line}" v-if="obj">
					<div v-if="obj.line" class="line" />
					<div v-if="!obj.line" class="flex-start pdlr5">
						<i v-if="obj.icon" class="material-icons mgr2">{{obj.icon}}</i>
						<span class="flex-1 nowrap">{{$ln(obj.label)}}</span>
						<i v-if="obj.list" class="material-icons mgl5 next">keyboard_arrow_right</i>
					</div>
				</div>
			</div>
			<!-- 第二層 contextmenu 容器 -->
			<div v-if="c2list" :class="{'opacity0': !c2left}" class="desktop-context-menu flex-col pdtb3"
				:style="{top: c2top+'px', left: c2left+'px'}" ref="menuCtn2" @mouseenter="onMouseEnterLv2">
				<!-- 選單 -->
				<div class="item flex-start pdtb2 pdlr5 w100p" v-for="obj in c2list" @click="onItemClick(obj)">
					<i v-if="obj.icon" class="material-icons mgr2">{{obj.icon}}</i>
					<span class="flex-1 nowrap">{{$ln(obj.label)}}</span>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import SelfSelectEditor from "@/components/Framework/SelfSelectEditor.vue";
export default {
	props: [],
	data() {
		return {
			param: null,
			e: null,
			width: 0,
			height: 0,
			/** 第二層選單 */
			c2list: null,
			c2width: 0,
			c2height: 0,
			mouseEnterE: null,
		}
	},
	beforeMount() {
		this.$store.state.desktop.contextmenu = this;
	},
    mounted() {
	},
	beforeDestroy() {},
	components: {},
    methods: {
		pop(param) {
			this.e = window.event;
			this.param = param;
			this.c2list = null;
			this.c2width = 0;
			setTimeout(()=>{
				this.width = this.$refs.menuCtn.offsetWidth;
				this.height = this.$refs.menuCtn.offsetHeight;
			}, 50);
		},
		onItemClick(obj) {
			// 選項物件如果有value就用value沒有才使用預設的param。
			let parm = obj.value || this.param.parm;
			if (obj.onclick)
				obj.onclick(parm);
			setTimeout(()=>{this.param = null;}, 10);
		},
		onMaskClick() {
			this.param = null;
			this.c2list = null;
		},
		onMouseEnter(obj, idx) {
			// 移動到沒有第二層的選項時
			if (!obj.list) {
				// 當前已經存在第二層選單 -> 延遲一點之後關閉第二層選單
				if (this.c2list) {
					clearTimeout(this.clearLv2Timeout);
					this.clearLv2Timeout = setTimeout(()=>{this.c2list = null;}, 1000);
				}
			}
			// 移動到有第二層的選項
			else {
				clearTimeout(this.clearLv2Timeout);
				// 選單有變才需要重刷
				if (this.c2list != obj.list) {
					this.c2list = obj.list;
					// 用 c2width 控制 c2left 控制 opacity0 以避免閃現問題
					this.c2width = 0;
					this.mouseEnterE = window.event;
					this.$nextTick(()=>{
						if (!this.$refs.menuCtn2) return;
						this.c2width = this.$refs.menuCtn2.offsetWidth;
						this.c2height = this.$refs.menuCtn2.offsetHeight;
					});
				}
			}
		},
		onMouseEnterLv2() {
			clearTimeout(this.clearLv2Timeout);
		},
		/** 常用選項 : 彈出下單盒 */
		optOrder(fn) {
			return {'icon': 'content_paste', 'label': '下单盒', onclick: fn};
		},
		/** 常用選項 : 自選管理 */
		optFav(sid) {
			// 設定持倉加入關注且是持倉商品就不顯示加減關注。
			if(M4C.SelfGroup.checkInPos(sid) && this.$store.state.config.posListAddToFocusList) {
				return;
			}
			let result = {};
			// 以第一組自選當加減群組。
			let obj = this.$store.state.data.ssgList[0];
			// 商品在自選中的索引
			let idx = obj.param.indexOf(sid);
			// 此自選群組已存在此合約 -> 刪除自選
			if (idx !== -1) {
				result = {'icon': 'delete', 'label': `從关注报价移除`, onclick: ()=>{obj.param.splice(idx, 1);}};
			}
			// 此自選群組未存在此合約 -> 加入自選
			else {
				result = {'icon': 'star', 'label': '加入至关注报价', onclick: ()=>{obj.param.push(sid);}};
			}
			return result;
		},
		/** 常用選項 : 欄位設定 */
		optColumn(fn) {
			return {'icon': 'playlist_add', 'label': '栏位设定', onclick: fn};
		},
		/** 常用選項 : 重新查詢 */
		optRefresh(fn) {
			return {'icon': 'refresh', 'label': '重新查询', onclick: fn};
		},
	},
	watch: {},
    computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		key() {
			return this.param ? this.param.key : null;
		},
		c1top() {
			if (!this.e) return 0;
			return (this.e.clientY + this.height) < (window.innerHeight - 10) ? this.e.clientY : (this.e.clientY - this.height);
		},
		c1left() {
			if (!this.e) return 0;
			return (this.e.clientX + this.width) < (window.innerWidth - 10) ? this.e.clientX : (this.e.clientX - this.width);
		},
		c2top() {
			let e = this.mouseEnterE;
			if (!e) return 0;
			let top = this.c1top + e.srcElement.offsetTop;
			let height = e.srcElement.offsetHeight;
			return (top + this.c2height) < (window.innerHeight - 10) ? top : (top + height - this.c2height - 2);
		},
		c2left() {
			let e = this.mouseEnterE;
			if (!e) return 0;
			if (!this.c2width) return 0;
			let right = this.c1left + e.srcElement.offsetLeft + e.srcElement.offsetWidth;
			return (right + this.c2width) < (window.innerWidth - 10) ? right : (this.c1left - this.c2width + 4);
		},
	},
}
</script>

<style scoped>
.desktop-context-menu-ctn {
	z-index: 2;
}
.desktop-context-menu-mask {
	background-color: black;
	opacity: .05;
}
.desktop-context-menu {
	position: absolute;
	background-color: white;
	border: 1px solid #999;
	overflow: auto;
	box-sizing: border-box;
}
.item {
	color: black;
	box-sizing: border-box;
	min-width: 10em;
}
.item:hover {
	background-color: #C8C8C9;
}
.material-icons {
	color: #333;
	font-size: 1.45em;
}
.material-icons.next {
	color: #444;
	font-size: 1.5em;
}
.line {
	border-bottom: 1px solid #DADCE0;
}
</style>