<template>
    <div class="m4c-race-dcore hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		M4C.RaceDCore = this;
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		race({connKey, company, product, hostList, portList}) {
			console.log(`[${connKey}] RaceDCore.race : comp[${company}] prod[${product}] host[${hostList}] port[${portList || ''}]`);
			let alreadyResolve = false;
			let raceTimeout;
			return new Promise((resolve, reject)=>{
				// 只有一台時直接使用
				if (hostList.length === 1) {
					console.log(`[${connKey}] RaceDCore.race resolve only 1 host : ${hostList[0]}`);
					resolve({host: hostList[0]});
					return;
				}
				// 開始對多台進行 acstk.login 競速
				for (let i=0; i<hostList.length; i++) {
					let host = hostList[i];
					let port = Array.isArray(portList) ? (portList[i] || portList[0]) : portList;
					let url = `https://${host}${port?(':'+port):''}/ss2/api?cmdLine={"s":"ac","c":"http.acstk.login","d":{"comp":"${company}","pd":"${product}"},"lg":"racer","app":"x4","acstk":"","sig":"","r":"${new Date().getTime()}"}`;
					console.log('RaceDCore.race url : ', url);
					fetch(url).then(res => res.json()).then(data => {
						// 若已經有別台的回應，表示別台先回應了，這邊直接結束
						if (alreadyResolve) return;
						clearTimeout(raceTimeout);
						// AC有回應且不是 -656 表示該主機可用
						if (data.s==="ac" && data.c==="http.acstk.login" && data.cd && data.cd !== -656) {
							console.log(`[${connKey}] RaceDCore.race winner : host[${host}] port[${port || ''}]`);
							alreadyResolve = true;
							resolve({host: host, port: port});
						}
					});
				};
				// 超過 10 秒都沒有競速結果 -> 直接取用第一台
				raceTimeout = setTimeout(()=>{
					console.log(`[${connKey}] RaceDCore.race timeout ! resolve hostList[0] : ${hostList[0]}`);
					resolve({host: hostList[0]});
				}, 9988);
			});
		},
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>