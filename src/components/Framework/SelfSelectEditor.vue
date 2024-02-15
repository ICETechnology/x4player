<template>
	<div class="self-selector-editor-ctn flex-col">
		<div class="body flex-1 font-size-small">
			<transition-group name="fade">
				<div class="flex-row group tcef" v-for="(grp,key) in groupList" :key="grp.idx">
					<input
						type="text"
						class="flex-item"
						v-model="list[key]"
						@blur="changeName(key)"
					>
					<label
						class="flex-vertical-center material-icons"
						@click="deleteGroup(key)"
					>{{grp.keep ? 'block' : 'delete'}}</label>
				</div>
			</transition-group>
		</div>
		<div class="foot flex-center tcef" @click="addGroup">{{$ln('新增自选')}}</div>
	</div>
</template>
<script>
import BtnBack from "@/components/BtnBack.vue";
import Button from "@/components/Framework/Button.vue";
export default {
	data() {
		return {
			namePrefix: this.$ln("自选群组"),
			lastSN: 0
		};
	},
	props: ["param"],
	mounted() {
		this.initList();
	},
	components: { BtnBack, Button },
	methods: {
		// 初始化自選郡組
		initList() {		
			//重設索引值(為了transition-group的動畫效果，需要唯一key且不變動)
			this.resetIdx();
			//處理序號
			this.parseLastSN();
		},
		// 重設索引值(全群組)
		resetIdx() {
			this.groupList.map((grp, key) => {
				grp.idx = key;
			});
			M4C.SelfGroup.updateGroupidx(this.groupList);
		},
		// 過濾最新序號
		parseLastSN() {
			let self = this;
			let maxSN = 0;
			//找到符合條件的，並取序號出來當lastSN;
			for (let i = 0; i < this.groupList.length; i++) {
				let label = this.$ln(self.groupList[i].label);
				//取出自選群組後的數字序號
				let ser = label.substr(self.namePrefix.length);
				let name = label.substr(0,self.namePrefix.length);
				//是「自選群組」而且是有序號的名稱
				let isPared = (name == self.namePrefix) && (!isNaN(ser));
				if (isPared) {
					//處理是否為最後序號
					maxSN = maxSN > Number(ser) ? maxSN : Number(ser);
				}
			}
			if (self.lastSN != maxSN) {
				//設定最後序號
				self.lastSN = maxSN;
			}
		},
		// 新增自選群組
		addGroup() {
			if (vuex.data.ssgList.length >= 10) {
				vuex.notify('error', this.$ln('群組數量超過限制'));
				return;
			}
			let grpName = this.createGroupName();
			M4C.SelfGroup.addGroup({
				label: grpName[0],
				param: [],
				idx: this.groupList.length
			});
			this.parseLastSN();
		},
		// 建立預設自選群組名稱及索引
		createGroupName() {
			let ser = this.lastSN + 1;
			// 最新序號如果是0的話(代表沒有自選群組)，idx預設為1
			let idx = this.lastSN !== 0? this.groupList[this.groupList.length - 1].idx + 1: 1;
			this.lastSN = idx;
			// 回傳自選名稱及index
			return [this.namePrefix + ser, idx];
		},
		// 刪除自選群組
		deleteGroup(idx) {
			// 如果是保留群組就不做處理。
			if(this.groupList[idx].keep) return;
			let self = this;
			let groupName = this.groupList[idx].label;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("确认删除"),
				content: `${self.$ln("确认删除")}: ${groupName}?`,
				confirm: () => {
					M4C.SelfGroup.removeGroup(idx);
					self.parseLastSN();
				}
			});
		},
		// 修改自選郡組名稱
		changeName(idx) {
			let str = this.list[idx];
			// 支持限制名稱長度以免異常
			if (str.length > 12) {
				vuex.notify(`error`, this.$ln('名稱長度超過限制'));
				// 恢復最後的文字內容
				this.$set(this.list, idx, vuex.data.ssgList[idx].label);
				return;
			}
			M4C.SelfGroup.changeGroupName(idx, str);
			this.parseLastSN();
		}
	},
	computed: {
		// 透過核心取得自選群組
		groupList() {return this.$store.state.data.ssgList;},
		// 项目名称清单
		list() {return this.groupList.map(grp => this.$ln(grp.label));},
	}
};
</script>
<style scoped>
.head {
	padding: 0 10px;
	background-color: #333;
}
.body {
	height: calc(100% - 75px);
	overflow-y: auto;
	overflow-x: hidden;
}
.foot {
	height: 50px;
	color: rgb(241, 152, 9);
	background-color: #333;
}
.group {
	padding: 10px;
	background-color: #303030;
	justify-content: space-between;
}
.group {
	border-top: 1px rgba(70, 70, 70) solid;
	border-bottom: 1px rgba(20, 20, 20) solid;
}
.group input {
	color: white;
	background-color: #484848;
	padding: 10px;
	border-radius: 10px;
	width: 75%;
	border: 1px solid gray;
}

.fade-enter-active,
.fade-leave-active {
	transition: all 0.5s ease;
}

.fade-enter {
	transform: translateX(50px);
	opacity: 0;
}

.fade-leave-to {
	transform: translateX(-50px);
	opacity: 0;
}
</style>
