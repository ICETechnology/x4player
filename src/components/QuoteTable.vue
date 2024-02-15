<template>
    <div class="quote-table-list-ctn" v-press="onPress">
		<div class="FULL scrolling-y">
			<table class="" @touchstart.stop="" @touchmove.stop="" @touchend.stop="">
				<thead>
					<tr>
						<th class="text-align-left">{{$ln('名称')}}</th>
						<th class="nowrap" v-for="obj in showList">{{obj.label}}</th>
					</tr>
				</thead>
				<tbody>
					<QuoteTableTr class="tr" v-for="expandObj in expandObjList" :sid="expandObj.sid"
						 @onExpand="onExpand" :expandObj="expandObj" />
				</tbody>
			</table>
		</div>
    </div>
</template>

<script>
import QuoteTableTr from "@/components/QuoteTableTr.vue";

export default {
	props: ["param", "suspend", "tabKey"],
	data() {
		return {
			expandSid: '',
			expandContracts: [],
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		QuoteTableTr,
	},
    methods: {
		/** 長按 */
		onPress(e) {
			let quoteTableTr = e.srcElement.closest('.quote-table-tr');
			let sid = quoteTableTr.getAttribute("sid");
			// 拖曳中情境時，關閉長按功能
			// if (this.$store.state.sync.quoteDragMode) return;
			this.$store.commit("setSelectedSymbol", sid);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		/** 展開某合約 */
		onExpand(expand, sid, moreContracts) {
			this.expandSid = expand ? sid : '';
			this.expandContracts = expand ? moreContracts.map(sid=>{return {'sid': sid}}) : [];
		}
	},
	watch: {},
    computed: {
		/** 使傳入參數成為響應式 */
		expandObjList() {
			let list = [...this.param.expandList];
			// 有展開時，將展開內容列表插入展開index
			if (this.expandSid && this.expandContracts) {
				let idx = this.param.expandList.findIndex(o=>o.sid===this.expandSid);
				list.splice(idx+1, 0, ...this.expandContracts);
			}
			return list;
		},
		/** 顯示欄位列表 */
		showList() {
			return this.$store.state.columnSD.quote.show;
		},
	},
}
</script>

<style scoped>
/* for sticky */
table {
	table-layout: fixed;
	border-spacing: 0;
}
/* 列首永遠固定於上 */
thead tr th {
	position: sticky;
	top:0;
	z-index: 1;
	padding: 2px;
	background-color: #333;
	border-bottom: 1px solid #999;
}
/* 首行永遠固定於左 */
th:first-child {
	position:sticky;
	left: 0;
	z-index: 2;
}

th {
	width: 33.33vw;
	min-width: 33.33vw;
	box-sizing: border-box;
	text-align: right;
}
th.name {
	width: 20vw;
}
th.rate {
	width: 10vw;
}
th.vol {
	width: 10vw;
}

</style>