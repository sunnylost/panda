
/**
 * 配置信息
 */
function panda() {
}

panda.config = function(config) {
	var configInfo = panda.configInfo;
	for(var k in config) {
		if(hasOwn.call(config, k)) {
			configInfo[k] = config[k];
		}
	}
	this.configInfo = configInfo;
};

panda.configInfo = {

	paths: {}
};