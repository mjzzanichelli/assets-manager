var path = require('path');

var getOriginStruct = function(){
	return {
			"id": undefined
			, "source":undefined
			, "virtualpath": undefined
			, "destination": undefined
			, "bundles": []
	};
};

var getBundleStruct = function(){
	return {
			"id": undefined
			, "options": undefined
			, "assets": []
	};
};

var getAssetsStruct = function(){
	return {
		"type": undefined
		, "src": []
	};
};

var assets = {
	"javascripts":[]
	, "styles": []
};

var areObjectsALike = function(){
	var objs = Array.prototype.slice.call(arguments,0);
	while (objs.length>1){
		for (var prop in objs[0]) if (!objs[1].hasOwnProperty(prop)) return false;
		for (var prop in objs[1]) if (!objs[0].hasOwnProperty(prop)) return false;
		objs = objs.slice(1);
	} 
	return true;
};

var getObjectsAlikeness = function(objectsArr,type){
	if (objectsArr.constructor !== [].constructor)return false;
	var typeStruct = undefined;
	switch(type){
		case "origin":
				typeStruct = getOriginStruct();
			break;
		case "bundle":
				typeStruct = getBundleStruct();
			break;
		case "assets":
				typeStruct = getAssetsStruct();
			break;
		default:
			typeStruct = undefined;
			break;
	}
	if (typeStruct===undefined) return false;
	var isAlike = true;
	return objectsArr.every(function(item,i,origin){
		if (areObjectsALike(item,typeStruct)) return true;
		else {
			console.log("error for "+ type +"["+ i +"]", item);
			return false;
		}
	});
};

var purifyBundles = function(bundles){
	
	for (var b in bundles){
		bundles[b]["assets"] = bundles[b]["assets"].filter(function(item, pos, self) {
		    return self.indexOf(item) == pos;
		});
		bundles[b]["virtualassets"] = bundles[b]["virtualassets"].filter(function(item, pos, self) {
		    return self.indexOf(item) == pos;
		});
	}
};

var findBundles = function(bundles,oldCnt){
	console.log("-------------------------------");
	var newCnt = 0;
	for (var b in bundles){
		var cnt = bundles[b]["assets"].length;
		while(cnt--){
			var srcItem = bundles[b]["assets"][cnt];
			if (typeof srcItem === "function") {
				newCnt++;
				var _bundle_files = srcItem(bundles,"assets");
				var _bundle_virtualfiles = srcItem(bundles,"virtualassets");
				if (_bundle_files.every(function(item){return typeof item === "string";})) {
					Array.prototype.splice.apply(bundles[b]["assets"],[cnt,1].concat(_bundle_files));
					Array.prototype.splice.apply(bundles[b]["virtualassets"],[cnt,1].concat(_bundle_virtualfiles));
				}
			}
		}
	};
	if(newCnt===oldCnt) {
		console.log(newCnt, "cannot find bundles");
		return false;
	}
	else if(newCnt===0) {
		console.log(newCnt, "All bundles find");
		purifyBundles(bundles);
		return true;
	}
	else {
		console.log(newCnt, "found bundles");
		return findBundles(bundles,newCnt);
	}
	
	console.log("-------------------------------");
};

var getBundleFiles = function(bundles,assetsType){
	return bundles[this["bundle"]][assetsType];
};

var extractBundles = function(conf,type){
	var _bundles = {};
	var escape = false;
	var ext = type==="javascripts" ? "js" : (type==="styles" ? "css" : type);
	if (getObjectsAlikeness(conf,"origin")){
		conf.map(function(conf_item,ci){
			if (getObjectsAlikeness(conf_item["bundles"],"bundle")){
				conf_item["bundles"].map(function(bundle_item,bi){
					var _item_name = conf_item.id+"."+bundle_item.id;
					_bundles[_item_name] = {
						"id": _item_name
						, "min": conf_item.destination +"/"+ bundle_item.id +".min."+ ext
						, "concat": conf_item.destination +"/"+ bundle_item.id +"."+ ext
						, "no-min": bundle_item.options["no-min"] || false
						, "no-create": bundle_item.options["no-create"] || false
						/*, "virtualpath-source": conf_item["virtualpath-source"] +"/"
						, "virtualpath-destination": conf_item["virtualpath-destination"] +"/"*/
						, "assets":[]
						, "virtualassets":[]
					};
					if (getObjectsAlikeness(bundle_item["assets"],"assets")){
						bundle_item["assets"].map(function(asset_item,ai){
							if (asset_item["type"]==="files"){
								_bundles[_item_name].assets = _bundles[_item_name].assets.concat(asset_item["src"].map(function(srcItem){
									return conf_item.source +"/"+ srcItem;
								}));
								_bundles[_item_name].virtualassets = _bundles[_item_name].virtualassets.concat(asset_item["src"].map(function(srcItem){
									return conf_item.virtualpath +"/"+ srcItem;
								}));
							} else if (asset_item["type"]==="bundles"){
								_bundles[_item_name].assets = _bundles[_item_name].assets.concat(asset_item["src"].map(function(srcItem){
									return (function(bdlName){
										return getBundleFiles.bind({"bundle":bdlName});
									})(srcItem);
								}));
								_bundles[_item_name].virtualassets = _bundles[_item_name].virtualassets.concat(asset_item["src"].map(function(srcItem){
									return (function(bdlName){
										return getBundleFiles.bind({"bundle":bdlName});
									})(srcItem);
								}));
							}
						});
					} else escape = true;
				});
			} else escape = true;
		});
	} else escape = true;
	if (escape) return false;
	var _found = findBundles(_bundles);
	return _found ? _bundles : _found;
};

var extendAssets = function(conf,type){
	if (conf.hasOwnProperty(type) && assets.hasOwnProperty(type)){
		var _conf_type = conf[type]
		;
		var bundles = extractBundles(_conf_type,type);
		for (var b in bundles)assets[type].push(bundles[b]);
	} else return [];
};


var setAssets = function(conf){
	console.log("-------- SET ASSETS start("+ (new Date()).toString() +") --------");
	if (typeof conf==="object"){
		var javascripts = extendAssets(conf,"javascripts");
		var styles = extendAssets(conf,"styles");
	}
	console.log("-------- SET ASSETS end("+ (new Date()).toString() +") --------");
	return new getAssets();
};
var getAssets = function(){
	this.bundles = assets;
	return this;
};

getAssets.prototype.watch = function(type,bundles){
	var _watchings,
		_files = []
	;
	switch(type){
		case "javascripts":
			_watchings = this.extract("javascripts","concat",bundles);
			break;
		case "styles":
			_watchings = this.extract("styles","min",bundles);
			break;
		default:
			return _files;
			break;
	}
	for (var w in _watchings){
		_files = _files.concat(_watchings[w]);
	}
	console.log("-------- WATCHING: --------");
	_files.map(function(file){
		console.log(file);
	});
	console.log("---------------------------");
	return _files;
};

getAssets.prototype.extract = function(type,operation,bundles){
	var _bundles = bundles || this.bundles;
	if (_bundles.hasOwnProperty(type)){
		var extraction = {};
		var bundles = _bundles[type];
		for (var b in bundles){
			if (operation==="concat" && type==="javascripts" && !bundles[b]["no-create"]) extraction[bundles[b].concat] = bundles[b].assets;
			else if (operation==="concatmin" && type==="javascripts" && !bundles[b]["no-create"]) extraction[bundles[b].min] = bundles[b].assets;
			else if (operation==="min" && type==="styles" && !bundles[b]["no-create"]) extraction[bundles[b].min] = bundles[b].assets;
		}
		return extraction;
	} else return false; 
};

getAssets.prototype.minifyjs = function(bundles){
	var _bundles = bundles || this.bundles;
	_bundles = JSON.parse(JSON.stringify(_bundles));
	var _minify = {files:{},temps:[]};
	var _no_min = [];
	_bundles["javascripts"].map(function(bdl){
		if(bdl["no-min"]) _no_min = _no_min.concat(bdl["assets"].map(function(asset){return path.normalize(asset);}));
	});
	_bundles["javascripts"].map(function(bdl){
		var _assets = bdl["assets"];
		_assets.map(function(asset,i){
			asset = path.normalize(asset);
			if (bdl["no-min"] || _no_min.some(function(a){return a == asset;})) bdl["assets"][i] = asset;
			else {
				var _temp_dir = path.dirname(asset)+"\\.temp";
				var _filename = _temp_dir +"\\"+ path.basename(asset, '.js')+".min.js";
				_minify.files[_filename] = asset;
				bdl["assets"][i] = _filename;
				if (!_minify.temps.some(function(a){return a == _temp_dir;}))_minify.temps.push(_temp_dir);
			}
		});
	});
	
	_minify.bundles = _bundles;
	return _minify;
};


getAssets.prototype.content = function(bundles){
	var output = "";
	var _bundles = bundles || this.bundles;
	var getIncludeTag = function(bundleType){
		switch(bundleType){
			case "javascripts":
				return '<script type="text/javascript" src="$repl"></script>';
				break;
			case "styles":
				return '<link rel="stylesheet" type="text/css" media="all" type="text/javascript" href="$repl"/>';
				break;
			default:
				return '$repl';
				break;
			
		}
	};
	for (var t in _bundles){
		var _includeTag = getIncludeTag(t);
		output+= "*************************************" +"\r\n";
		output+= "*************************************" +"\r\n";
		output+= "*********  " + t.toUpperCase() +"  *********" + "\r\n";
		output+= "*************************************" +"\r\n";
		output+= "*************************************" +"\r\n";
		output+= "+++++++++++++++++++++++++++++++++++++" +"\r\n\r\n";
		for (var b in _bundles[t]){
			output+= "/////////////////////////////////////" +"\r\n";
			output+= "BUNDLE" +"\r\n";
			output+= "-------------------------------------" +"\r\n";
			output+= _bundles[t][b].id + "\r\n";
			output+= "-------------------------------------" +"\r\n";
			output+= "BUILD" +"\r\n";
			output+= "-------------------------------------" +"\r\n";
			output+= "minify -> " + path.normalize(_bundles[t][b].min) +"\r\n";
			output+= "concat -> " + path.normalize(_bundles[t][b].concat) + "\r\n";
			output+= "-------------------------------------" +"\r\n";
			output+= "ASSETS" +"\r\n";
			output+= "-------------------------------------" +"\r\n";
			for (var a in _bundles[t][b].assets){
				output+= path.normalize(_bundles[t][b].assets[a]) +"\r\n";
			}
			output+= "-------------------------------------" +"\r\n";
			output+= "INCLUDE" +"\r\n";
			output+= "-------------------------------------" +"\r\n";
			for (var a in _bundles[t][b].virtualassets){
				output+= _includeTag.replace("$repl",path.normalize(_bundles[t][b].virtualassets[a]).split("\\").join("\/")) +"\r\n";
			}
			output+= "-------------------------------------" +"\r\n";
			output+= "/////////////////////////////////////" +"\r\n";
			output+="\r\n\r\n";
		}
		output+= "+++++++++++++++++++++++++++++++++++++" +"\r\n\r\n";
	};
	return output;
};

module.exports = {
	set: setAssets
	, get: getAssets
};