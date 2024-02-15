<template>
	<div v-if="display" class="FULL loading-icon-ctn lds-css ng-scope flex-center"
		:class="{'transparent': transparent, 'dark': dark}">
		<i class="material-icons md-36 infinity-rotate" :style="{'font-size': size+'em'}">rotate_right</i>
	</div>
</template>

<script>
export default {
	/** transparent: true 表示不遮蔽(要穿透) */
	/** dark: true 表示需要暗色遮罩背景 */
	props: ['transparent', 'value', 'dark', 'size'],
	data() {
		return {
        }
    },
    mounted() {},
	components: {
	},
    methods:{
	},
	watch: {
		value(nv) {
			// 有帶 value 時表示要依據此 value 做 show/hide，且保證最多 show 10秒 (安全機制)
			if (nv) {
				setTimeout((self)=>{
					self.$emit('input', false);
				}, 10000, this);
			}
		}
	},
    computed: {
		display() {
			return this.value != null ? this.value : true;
		},
    }
}
</script>

<style>
.loading-icon-ctn > i.material-icons{
  font-size: 1.8em;
  /* 避免旋轉晃動 */
  line-height: initial;
}
.infinity-rotate {
  -webkit-animation:spin 1s linear infinite;
  -moz-animation:spin 1s linear infinite;
  animation:spin 1s linear infinite;
}
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
.loading-icon-ctn.transparent {
	pointer-events: none;
}
.loading-icon-ctn.dark {
	background-color: rgba(0, 0, 0, 0.5);
}
</style>