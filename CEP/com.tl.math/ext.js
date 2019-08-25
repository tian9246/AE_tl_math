/*************************************************************************
* tl math plugin and CEP
*thomas laforge  Copyright 2019
**************************************************************************/

function onLoaded() {
	var pluginName = "tlMath";
	var pluginVersion =1.15;
	var csInterface = new CSInterface();
	var appName = csInterface.hostEnvironment.appName;
	csInterface.setWindowTitle = "tl Math Setup";
	var numParams =10;
	var err = defineErr();

	setParamsSettings("slider", numParams, 1, "sliderGrp");
	setParamsSettings("point", numParams, 3, "pointGrp");
	setParamsSettings("cbox", numParams, 1, "cboxGrp");
	setParamsSettings("color", numParams, 3, "colorGrp");
	setParamsSettings("rotation", numParams, 1, "rotationGrp");
	loadJSX();
	sendMessageToPlugin();
    updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);
	// Update the color of the panel when the theme color of the product changed.
	csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, onAppThemeColorChanged);
	defaultVal(); //load default ddl val
	var editors = setEditors();
	//laod default arb
	var arbdefaultStr = loadDefaultArb();
	var arbData = JSON.parse(arbdefaultStr);
	copyDataToGUI (arbData, editors,numParams);

	//presets loading
	var presetsList;
	csInterface.addEventListener("tlmath.preset", function(fromPresetEvent){
		presetsList = fromPresetEvent.data;
		updatePresetMenu (presetsList, editors);
	});
	loadPluginPresets(arbData);

	//evt listener from plugin
	csInterface.addEventListener("tlmath.arbSentfromPlugin", function(fromArbEvent) {
		if (fromArbEvent.data.effectInfo.effectName !=pluginName) {alert (err.PresetFile); return};
			arbData = fromArbEvent.data;
			pluginVersion = parseFloat (arbData.effectInfo.pluginVersion).toFixed(2);
			copyDataToGUI (arbData, editors,numParams);
	});
	csInterface.addEventListener("tlmath.arbSentfromPreset", function(fromArbEvent){
		if (fromArbEvent.data.effectInfo.effectName !=pluginName) {alert (err.PresetFile); return};
		if (parseFloat(pluginVersion)<parseFloat(fromArbEvent.data.effectInfo.minimalPluginVersion)) {alert (err.pluginVersion); return}
			arbData = fromArbEvent.data; 
			copyDataToGUI (arbData, editors,numParams);
		});
	$("#seachBarInput").on("keyup", function(){
		var filter = $("#seachBarInput").val().toUpperCase();
		var list = document.getElementsByClassName ("presetsBlock");
		for (var i=0; i<list.length; i++){
			var foundB = false;
			for (var j=0; j<presetsList.preset[i].tags.length; j++){
				if (presetsList.preset[i].tags[j].toUpperCase().indexOf(filter) >-1){
					foundB = true;
					break;
				}
			}
			if (foundB == true ){
				list[i].style.display ="";
			}else{
				list[i].style.display ="none";
				}
			}
		});
	$("#presetsListAccess").on("change", function(){
		var  presetSelectedIndex = $('input[name="presetListRb"]:checked').val();
		var descriptionStr = "description : "+ presetsList.preset[presetSelectedIndex].description;
		$("#presetDescr").text(descriptionStr);
		});
	$("#btnLoad").on("click", function() {		
		loadPresetJSONFile();
		});
	$("#btnExport").on("click", function() {
		var arbDataToSend = sendDataToPlugin(editors, arbData,numParams);		
		exportPresetAsJSON(arbDataToSend);
		});
	$("#btnSavePreset").on("click", function() {
		var arbDataToSend = sendDataToPlugin(editors, arbData,numParams);		
		savePresetAsJSON(arbDataToSend);
		});
	$("#btnLoadPresetFromMenu").on("click", function(){
		loadPresetFromMenu(presetsList, editors,numParams);
		tooglePresets();
	});
	$("#btnApply").on("click", function() {
		var arbDataToSend = sendDataToPlugin(editors, arbData, numParams);
		if (arbDataToSend){
			var arbDataStr = JSON.stringify(arbDataToSend);
			evalScript("$._ext.sendDataToPlugin("+arbDataStr+")");
			}
		});
	}
function sendMessageToPlugin(){
	evalScript("$._ext.sendMessageToPlugin()");
	}
function defineErr(){
	var err = {};
	err.PresetFile = "Error: the tlMath Preset is not recognized";
	err.pluginVersion ="Error: the plugin Version is not compatible with this preset";
	err.selectPreset = "Please, select a preset";
	return err;
	}
function updatePresetMenu (presetsList){
	for (var i =0; i< presetsList.preset.length; i++){
		var inputStr = '<label  id="'+presetsList.preset[i].name+'"  class="presetsBlock">'+
		'<input type="radio" class="presetIconRadio" id="presetIconRadio'+i+'" name="presetListRb" value="'+i+'"/>'+
		'<img src="'+presetsList.preset[i].icon+'" id="presetIconImgsId">'+
		'<div id="iconText">'+presetsList.preset[i].name+'</div>'
		'</label>';
		$("#presetsListAccess").append(inputStr);
		}
	}

function loadPresetFromMenu(presetsList, editors, numParams){
	var selectedPreset = parseInt($("input[name='presetListRb']:checked").val());
	if (typeof(selectedPreset) === "undefined"){
		alert (err.selectPreset);
		return
		}
	var jsonDataObj = JSON.parse(presetsList.preset[selectedPreset].str);
	copyDataToGUI (jsonDataObj,  editors, numParams);
	}
function loadPresetJSONFile(){
	 evalScript("$._ext.loadJSONFile()");
	}
function exportPresetAsJSON(arbDataToSend){
	if (arbDataToSend){
		var arbDataStr = JSON.stringify(arbDataToSend);
		evalScript("$._ext.exportPresetFile("+arbDataStr+")");
		}
	}
function savePresetAsJSON(arbDataToSend){
	if (arbDataToSend){
		var arbDataStr = JSON.stringify(arbDataToSend);
		evalScript("$._ext.exportPresetFileToUserLib("+arbDataStr+")");
		}
	}
/**
 * clean json str  replace \ by double \
 * input : str
 * return str
 */
function cleanJsonToArbStr (str){
	str = str.replace(/\n/g, "\\n")
               .replace(/\'/g, "\\' ")
               .replace(/\"/g, '\\"')
               .replace(/\&/g, "\\&")
               .replace(/\r/g, "\\r")
               .replace(/\t/g, "\\t")
			   .replace(/\f/g, "\\f");

    return str;
	}
/**
 * clean json str  replace double\ by  \
 * input : str
 * return str
 */
function cleanJsonFromArbStr (str){
	str = str.replace(/\\n/g, "\n")
               .replace(/\\'/g, "\'")
               .replace(/\\"/g, '\"')
               .replace(/\\&/g, "\&")
               .replace(/\\r/g, "\r")
               .replace(/\\t/g, "\t")
			   .replace(/\\f/g, "\f");

    return str;
	}
function setflagFromGL (arbData, strArr){
	var boolResultB = false;
	for (var i =0; i<strArr.length; i++){
		if (arbData.gl_expression.gl_frag_sh.indexOf(strArr[i]) !=-1 ||
		arbData.gl_expression.gl_vert_sh.indexOf(strArr[i]) !=-1){
			boolResultB = true;
		} 
	}
	return boolResultB;
	}
function setflagFromExpr (arbData, strArr){
	var boolResultB = false;
	for (var i =0; i<strArr.length; i++){
		if (arbData.math_expression.alphaExpr.indexOf(strArr[i]) !=-1){
			boolResultB = true;
			return boolResultB;
		}
		if (arbData.math_expression.exprRGBModeB &&
			arbData.math_expression.rgbExpr.indexOf(strArr[i]) !=-1){
				boolResultB = true;
				return boolResultB;
			}
		else if (arbData.math_expression.redExpr.indexOf(strArr[i]) !=-1 ||
			arbData.math_expression.greenExpr.indexOf(strArr[i]) !=-1||
			arbData.math_expression.blueExpr.indexOf(strArr[i]) !=-1){
				boolResultB = true;
				return boolResultB;
			}

	} 

	return boolResultB;
	}
function setParamsSettings(paramName, numParams, paramDimension, paramGroupId){
	var grp = document.getElementById(paramGroupId);
	var paramGrpStr = '<th>Parameter</th> \n'+
	'<th>GUI Name</th>\n'+
	'<th>Visible</th>\n'+
		'<tr>'+
		'<td>'+paramName+' Group</td> \n'+
		'<td><input type="text"   id="'+paramName+'GrpName" value="'+paramName+'Grp" maxlength="31"></td> \n'+
		'<td><input type="checkbox" name="'+paramName+'GrpVisible" id="'+paramName+'+GrpVisible" onClick= "toogleCheckbox(\'cb'+paramName+'\', \''+paramName+'GrpVisible\')" checked ></td> \n'+
		'</tr> \n';
	grp.innerHTML =paramGrpStr;
	strGrp ="";
	for (var i=0; i<numParams; i++){
		var paramStr ='<tr>'+
			'<td>'+paramName+' '+i+'</td> \n'+
			'<td><input type="text" id = "'+paramName+i+'_name" value="'+paramName+i+'" maxlength="31"></td> \n'+
			'<td ><input type="checkbox" id="'+paramName+i+'_visible"  class="cb'+paramName+'" checked></td> \n'+
			'</tr> \n'
		strGrp+=paramStr;
		}
		grp.innerHTML +=strGrp;
	}
function getParamsSettings(arbData, paramName, numParams, paramDimension, paramGroupId){

	$("#"+paramName+"GrpName").val(arbData.gui_settings[paramGroupId].grpName.toString());
	$("#input[name="+paramName+"GrpVisible]").prop('checked', arbData.gui_settings[paramGroupId].grpVisibleB);
	for (var i=0; i<numParams; i++){
		$("#"+paramName+i+"_name").val(arbData.gui_settings[paramGroupId].params[i].name.toString());
		$("input[names"+paramName+i+"Visible]").prop('checked', arbData.gui_settings[paramGroupId].params[i].visibleB);
		}
	}
function sendParamsSettings(arbData, paramName, numParams, paramDimension, paramGroupId){
	
	arbData.gui_settings[paramGroupId].grpName =$("#"+paramName+"GrpName").val().toString();	
	arbData.gui_settings[paramGroupId].grpVisibleB =$("#"+paramName+"GrpVisible").is(':checked');
	for (var i=0; i<numParams; i++){
		arbData.gui_settings[paramGroupId].params[i].name =$("#"+paramName+i+"_name").val().toString();
		arbData.gui_settings[paramGroupId].params[i].visibleB= $("#"+paramName+i+"Visible").is(':checked');
	}
	return arbData;

}
function copyDataToGUI (arbData, editors, numParams) {
	$("#gl_frag_tab_console").html(arbData.gl_expression.gl_frag_error.toString().replace("\\n", "<br/>"));
	$("#gl_vert_tab_console").html(arbData.gl_expression.gl_vert_error.toString().replace("\\n", "<br/>"));
	$("#expr_red_tab_console").html(arbData.math_expression.red_error.toString().replace("\\n", "<br/>"));	
	$("#expr_green_tab_console").html(arbData.math_expression.green_error.toString().replace("\\n", "<br/>"));
	$("#expr_blue_tab_console").html(arbData.math_expression.blue_error.toString().replace("\\n", "<br/>"));
	$("#expr_rgb_tab_console").html(arbData.math_expression.rgb_error.toString().replace("\\n", "<br/>"));
	$("#expr_alpha_tab_console").html(arbData.math_expression.alpha_error.toString().replace("\\n", "<br/>"));
	if (arbData.gl_expression.gl_frag_sh){
		editors.gl_frag_editor.setValue(cleanJsonFromArbStr(arbData.gl_expression.gl_frag_sh.toString()), -1);
	}
	if (arbData.gl_expression.gl_vert_sh){
		editors.gl_vert_editor.setValue(cleanJsonFromArbStr(arbData.gl_expression.gl_vert_sh.toString()), -1);
	}
	if (arbData.math_expression.redExpr){
		editors.expr_red_editor.setValue(cleanJsonFromArbStr(arbData.math_expression.redExpr.toString(), -1));
	}
	if (arbData.math_expression.greenExpr){
		editors.expr_green_editor.setValue(cleanJsonFromArbStr(arbData.math_expression.greenExpr.toString(), -1));
	}
	if(arbData.math_expression.blueExpr){
		editors.expr_blue_editor.setValue(cleanJsonFromArbStr(arbData.math_expression.blueExpr.toString(), -1));
	}
	if(arbData.math_expression.rgbExpr){
		editors.expr_rgb_editor.setValue(cleanJsonFromArbStr(arbData.math_expression.rgbExpr.toString(), -1));
	}
	if(arbData.math_expression.alphaExpr){
		editors.expr_alpha_editor.setValue(cleanJsonFromArbStr(arbData.math_expression.alphaExpr.toString(), -1));
	}
	$("#presetName").val( cleanJsonFromArbStr(arbData.effectInfo.presetName.toString()));
	$("#descriptionText").val(cleanJsonFromArbStr(arbData.effectInfo.description.toString()));
	$("#presetTags").val(arbData.effectInfo.tags.toString());
	if(arbData.effectMode.gl_modeB){
		$("#langSelec").val("GLSL"); 
	}
	if(arbData.effectMode.expr_modeB){
		$("#langSelec").val("mExpr");
	}
	$("input[name=rgbmodeB]").prop('checked', arbData.math_expression.exprRGBModeB);
	$("#resolutionName").text(arbData.composition.resolution.toString());
	$("layerPositionName").text(arbData.composition.layerPosition.toString());
	$("layerScaleName").text(arbData.composition.layerScale.toString());
	$("compResolutionName").text(arbData.composition.compResolution.toString());
	$("#tsecName").text(arbData.composition.time_sec.toString());
	$("#tframeName").text(arbData.composition.time_frame.toString());
	$("#fpsName").text(arbData.composition.frame_rate.toString());
	$("#camera_pos").text(arbData.composition.camera_position.toString());
	$("#camera_targ").text(arbData.composition.camera_target.toString());
	$("#camera_rot").text(arbData.composition.camera_rotation.toString());
	$("#camera_zoom").text(arbData.composition.camera_zoom.toString());
	$("#expr_current_channelName").text(arbData.math_expression.expr_current_channel.toString());
	$("#expr_pixName").text(arbData.math_expression.expr_pix.toString());
	$("#expr_lumaName").text(arbData.math_expression.expr_luma.toString());
	$("#expr_red_offName").text(arbData.math_expression.expr_red_off.toString());
	$("#expr_green_offName").text(arbData.math_expression.expr_green_off.toString());
	$("#expr_blue_offName").text(arbData.math_expression.expr_blue_off.toString());
	$("#expr_alpha_offName").text(arbData.math_expression.expr_alpha_off.toString());
	getParamsSettings(arbData, "slider", numParams, 1, "sliderGrp");
	getParamsSettings(arbData, "point", numParams, 3, "pointGrp");
	getParamsSettings(arbData, "cbox", numParams, 1, "cboxGrp");
	getParamsSettings(arbData, "color", numParams, 3, "colorGrp");
	getParamsSettings(arbData, "rotation", numParams, 1, "rotationGrp");
	alert ("get and send params data with loop function")
	
	$("#layerGrpName").val(arbData.gui_settings.layerGrp.grpName.toString());
	$("input[name=layerGrpVisible]").prop('checked', arbData.gui_settings.layerGrp.grpVisibleB);
	$("#layer00_name").val(arbData.gui_settings.layerGrp.current_layer.name.toString());
	$("#layer01_name").val(arbData.gui_settings.layerGrp.extLayer_1.name.toString());
	$("input[name=layer01Visible]").prop('checked', arbData.gui_settings.layerGrp.extLayer_1.visibleB);
	}
function sendDataToPlugin(editors, arbData, numParams) {
	//copy  expressions
	arbData.gl_expression.gl_frag_sh = cleanJsonToArbStr((editors.gl_frag_editor.getValue()).toString());
	arbData.gl_expression.gl_vert_sh = cleanJsonToArbStr(( editors.gl_vert_editor.getValue()).toString());
	arbData.math_expression.redExpr= cleanJsonToArbStr((editors.expr_red_editor.getValue()).toString());
	arbData.math_expression.greenExpr =cleanJsonToArbStr(( editors.expr_green_editor.getValue()).toString())
	arbData.math_expression.blueExpr =  cleanJsonToArbStr((editors.expr_blue_editor.getValue()).toString());
	arbData.math_expression.rgbExpr =  cleanJsonToArbStr((editors.expr_rgb_editor.getValue()).toString());
	arbData.math_expression.alphaExpr = cleanJsonToArbStr(( editors.expr_alpha_editor.getValue()).toString());
	arbData.effectInfo.presetName = $("#presetName").val().toString();
	arbData.effectInfo.description = cleanJsonToArbStr($("#descriptionText").val().toString());
	arbData.effectInfo.tags =  ($("#presetTags").val().split(","));
	//detect if flags are active or not    
	
	//copy  mode settings
	($("#langSelec").val() ==("GLSL") ? arbData.effectMode.gl_modeB=true : arbData.effectMode.gl_modeB=false);
	($("#langSelec").val() ==("mExpr")? arbData.effectMode.expr_modeB=true : arbData.effectMode.expr_modeB = false);
	
	//copy compo settings	
	arbData.composition.resolution = $("#resolutionName").val().toString();
	arbData.composition.layerPosition= $("#layerPositionName").val().toString();
	arbData.composition.layerScale= $("#layerScaleName").val().toString();
	arbData.composition.compResolution = $("#compResolutionName").val().toString();
	arbData.composition.time_sec = $("#tsecName").val().toString();
	arbData.composition.time_frame = $("#tframeName").val().toString();
	arbData.composition.frame_rate = $("#fpsName").val().toString();
	arbData.composition.camera_position = $("#camera_pos").val().toString();
	arbData.composition.camera_target = $("#camera_targ").val().toString();
	arbData.composition.camera_rotation = $("#camera_rot").val().toString();
	arbData.composition.camera_zoom = $("#camera_zoom").val().toString();
	//copy settings for expr
	arbData.math_expression.exprRGBModeB = $("#rgbmodeB").is(':checked');
	arbData.math_expression.expr_current_channel = $("#expr_current_channelName").val().toString();
	arbData.math_expression.expr_pix =$("#expr_pixName").val().toString();
	arbData.math_expression.expr_luma =$("#expr_lumaName").val().toString();
	arbData.math_expression.expr_red_off =$("#expr_red_offName").val().toString();
	arbData.math_expression.expr_green_off =$("#expr_green_offName").val().toString();
	arbData.math_expression.expr_blue_off =$("#expr_blue_offName").val().toString();
	arbData.math_expression.expr_alpha_off=$("#expr_alpha_offName").val().toString();

	sendParamsSettings(arbData, "slider", numParams, 1, "sliderGrp");
	sendParamsSettings(arbData, "point", numParams, 3, "pointGrp");
	sendParamsSettings(arbData, "cbox", numParams, 1, "cboxGrp");
	sendParamsSettings(arbData, "color", numParams, 3, "colorGrp");
	sendParamsSettings(arbData, "rotation", numParams, 1, "rotationGrp");

	//copy layer settings
	arbData.gui_settings.layerGrp.grpName =$("#layerGrpName").val().toString();
	arbData.gui_settings.layerGrp.grpVisibleB =$("layerGrpVisible").is(':checked');
	arbData.gui_settings.layerGrp.current_layer.name = $("#layer00_name").val().toString();
	arbData.gui_settings.layerGrp.extLayer_1.name =$("#layer01_name").val().toString();
	arbData.gui_settings.layerGrp.extLayer_1.visibleB= $("#layer01Visible").is(':checked');

	if (arbData.effectMode.gl_modeB){

		arbData.flags.needsPixelAroundB = false;// only for expr mode
		arbData.flags.needsLumaB = false; // only for expr mode
		arbData.flags.pixelsCallExternalInputB =setflagFromGL (arbData, [arbData.gui_settings.layerGrp.extLayer_1.name]);
		arbData.flags.presetHasWideInputB =setflagFromGL (arbData, [arbData.composition.time_sec,arbData.composition.time_frame]);
		arbData.flags.usesCameraB =setflagFromGL (arbData, [arbData.composition.camera_position,arbData.composition.camera_target, arbData.composition.camera_rotation, arbData.composition.camera_zoom]);	
	}
	else{
		arbData.flags.presetHasWideInputB  =  setflagFromExpr (arbData, [arbData.composition.time_sec,arbData.composition.time_frame]);
		arbData.flags.needsPixelAroundB =  setflagFromExpr (arbData, 	[arbData.math_expression.expr_red_off, arbData.math_expression.expr_green_off, arbData.math_expression.expr_blue_off,arbData.math_expression.expr_alpha_off]);
		arbData.flags.pixelsCallExternalInputB  =  setflagFromExpr (arbData, [arbData.gui_settings.layerGrp.extLayer_1.name]);
		arbData.flags.needsLumaB  =  setflagFromExpr (arbData,[arbData.math_expression.expr_luma]);		
		arbData.flags.usesCameraB =  setflagFromExpr (arbData, [arbData.composition.camera_position,arbData.composition.camera_target, arbData.composition.camera_rotation, arbData.composition.camera_zoom]);
		}
	return arbData;
	}
function toogleCheckbox(className, currId){
	classItems = document.getElementsByClassName(className);
	parentItem =  document.getElementById(currId);

	if (parentItem.checked ==true){
		for (var i=0; i<classItems.length; i++){
			classItems[i].checked = true;
		}
	}
	else{
		for (var i=0; i<classItems.length; i++){
			classItems[i].checked = false;
		}
	}
	}
function setEditors(){
	var editors = {};
	editors.gl_frag_editor = glslEditor("gl_frag_editor");
	editors.gl_vert_editor= glslEditor("gl_vert_editor");
	editors.expr_red_editor = exprEditor("expr_red_editor");
	editors.expr_green_editor = exprEditor("expr_green_editor");
	editors.expr_blue_editor = exprEditor("expr_blue_editor");
	editors.expr_rgb_editor = exprEditor("expr_rgb_editor");
	editors.expr_alpha_editor  = exprEditor ("expr_alpha_editor");
	return editors;
	}
function defaultVal(){
	//var langSelec = document.getElementById("langSelec");
	//langSelec.value = "GLSL";
	langSelecFunc();
	toggleSettings();
	tooglePresets();
	toggleDescription();
	}
function tooglePresets(){
	var presetsMenu = document.getElementById("presetId");
	if (presetsMenu.style.display === "none"){
		presetsMenu.style.display = "block";
		}
	else{
		presetsMenu.style.display = "none";
		}
	}
function toggleSettings(){
	var settingsMenu = document.getElementById("settingsId");
	if (settingsMenu.style.display === "none"){
		settingsMenu.style.display = "block";
		}
	else{
		settingsMenu.style.display = "none";
		}
	}
function toggleDescription(){
	var descrMenu = document.getElementById("descriptionId");
	if (descrMenu.style.display === "none"){
		descrMenu.style.display = "block";
		}
	else{
		descrMenu.style.display = "none";
		}
	}
function openEditor(evt, tabName) {
		// Declare all variables
		var i, tabEditorList, glslGUILinks, consoleList;

		// Get all elements with class="tabcontent" and hide them
		tabEditorList = document.getElementsByClassName("tabEditor");
		for (i = 0; i < tabEditorList.length; i++) {
			tabEditorList[i].style.display = "none";
		}
		// Get all elements with class="tablinks" and remove the class "active"
		glslGUILinks = document.getElementsByClassName("glslGUI");
		for (i = 0; i < glslGUILinks.length; i++) {
			glslGUILinks[i].className = glslGUILinks[i].className.replace(" active", "");
		}
		// Show the current tab, and add an "active" class to the button that opened the tab
		document.getElementById(tabName).style.display = "block";

		//get all console items and hide unsed
		consoleList = document.getElementsByClassName("console");
		for (i = 0; i < consoleList.length; i++) {
			if (consoleList[i].id.indexOf (tabName) !=-1){
				consoleList[i].style.display = "block";
			}else{
				consoleList[i].style.display = "none";
			}
		}	
	}
function mathGuiModeFunc(){
	var mathGui = document.getElementsByClassName("mathGUI");
		var glslGui = document.getElementsByClassName("glslGUI");
		
	for (var i =0; i< mathGui.length; i++){
		$(mathGui[i]).show();
	}
	
	for (var i =0; i< glslGui.length; i++){
		$(glslGui[i]).hide();
	}
	mathGUIRgbModeFunc();
	

	}
function mathGUIRgbModeFunc(){
	if ($("#rgbmodeB").is(':checked')){
		$("#rgbExpBtn").show();
		$("#redExpBtn").hide();
		$("#greenExpBtn").hide();
		$("#blueExpBtn").hide();
		openEditor(event, 'expr_rgb_tab');
	}else{
		$("#rgbExpBtn").hide();
		$("#redExpBtn").show();
		$("#greenExpBtn").show();
		$("#blueExpBtn").show();
		openEditor(event, 'expr_alpha_tab');
	}

	}
function glslGuiModeFunc(){
		var mathGui = document.getElementsByClassName("mathGUI");
		 var glslGui = document.getElementsByClassName("glslGUI");
		for (var i =0; i< mathGui.length; i++){
				$(mathGui[i]).hide();
			}
		for (var i =0; i< glslGui.length; i++){
			$(glslGui[i]).show();
		}
		openEditor(event, 'gl_frag_tab');

	}	
function langSelecFunc() {
		var langSelec = document.getElementById("langSelec").value;
		if (langSelec === "mExpr"){
			mathGuiModeFunc();
		  }
	  else if (langSelec ==="GLSL"){
			glslGuiModeFunc();
		  }
	 }
function glslEditor(glMode){
		var editor = ace.edit(glMode);
		editor.setTheme("ace/theme/chrome");
		editor.session.setMode("ace/mode/glsl");
		editor.resize();
		return editor;
	}
function exprEditor(exprChan){
		var editor = ace.edit(exprChan);
		editor.setTheme("ace/theme/chrome");
		editor.session.setMode("ace/mode/javascript");
		editor.resize();
		return editor;
	}
/**
 * Update the theme with the AppSkinInfo retrieved from the host product.
 */
function updateThemeWithAppSkinInfo(appSkinInfo) {
	
    //Update the background color of the panel
    var panelBackgroundColor = appSkinInfo.panelBackgroundColor.color;
    document.body.bgColor = toHex(panelBackgroundColor);
        
    var styleId = "ppstyle";
    
    var csInterface = new CSInterface();
	var appName = csInterface.hostEnvironment.appName;
    
    if(appName == "PHXS"){
	    addRule(styleId, "button, select, input[type=button], input[type=submit]", "border-radius:3px;");
	}
	if(appName == "PHXS" || appName == "AEFT" || appName == "PRLD") {
		////////////////////////////////////////////////////////////////////////////////////////////////
		// NOTE: Below theme related code are only suitable for Photoshop.                            //
		// If you want to achieve same effect on other products please make your own changes here.    //
		////////////////////////////////////////////////////////////////////////////////////////////////
		
	    
	    var gradientBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 40) + " , " + toHex(panelBackgroundColor, 10) + ");";
	    var gradientDisabledBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 15) + " , " + toHex(panelBackgroundColor, 5) + ");";
	    var boxShadow = "-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 1px rgba(0, 0, 0, 0.2);";
	    var boxActiveShadow = "-webkit-box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6);";
	    
	    var isPanelThemeLight = panelBackgroundColor.red > 127;
	    var fontColor, disabledFontColor;
	    var borderColor;
	    var inputBackgroundColor;
	    var gradientHighlightBg;
	    if(isPanelThemeLight) {
	    	fontColor = "#000000;";
	    	disabledFontColor = "color:" + toHex(panelBackgroundColor, -70) + ";";
	    	borderColor = "border-color: " + toHex(panelBackgroundColor, -90) + ";";
	    	inputBackgroundColor = toHex(panelBackgroundColor, 54) + ";";
	    	gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -40) + " , " + toHex(panelBackgroundColor,-50) + ");";
	    } else {
	    	fontColor = "#ffffff;";
	    	disabledFontColor = "color:" + toHex(panelBackgroundColor, 100) + ";";
	    	borderColor = "border-color: " + toHex(panelBackgroundColor, -45) + ";";
	    	inputBackgroundColor = toHex(panelBackgroundColor, -20) + ";";
	    	gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -20) + " , " + toHex(panelBackgroundColor, -30) + ");";
	    }
	    
	
	    //Update the default text style with pp values
	    
	    addRule(styleId, ".default", "font-size:" + appSkinInfo.baseFontSize + "px" + "; color:" + fontColor + "; background-color:" + toHex(panelBackgroundColor) + ";");
	    addRule(styleId, "button, select, input[type=text], input[type=button], input[type=submit]", borderColor);    
	    addRule(styleId, "button, select, input[type=button], input[type=submit]", gradientBg);    
	    addRule(styleId, "button, select, input[type=button], input[type=submit]", boxShadow);
	    addRule(styleId, "button:enabled:active, input[type=button]:enabled:active, input[type=submit]:enabled:active", gradientHighlightBg);
	    addRule(styleId, "button:enabled:active, input[type=button]:enabled:active, input[type=submit]:enabled:active", boxActiveShadow);
	    addRule(styleId, "[disabled]", gradientDisabledBg);
	    addRule(styleId, "[disabled]", disabledFontColor);
	    addRule(styleId, "input[type=text]", "padding:1px 3px;");
	    addRule(styleId, "input[type=text]", "background-color: " + inputBackgroundColor) + ";";
	    addRule(styleId, "input[type=text]:focus", "background-color: #ffffff;");
	    addRule(styleId, "input[type=text]:	", "color: #000000;");
	    
	} else {
		// For AI, ID and FL use old implementation	
		addRule(styleId, ".default", "font-size:" + appSkinInfo.baseFontSize + "px" + "; color:" + reverseColor(panelBackgroundColor) + "; background-color:" + toHex(panelBackgroundColor, 20));
	    addRule(styleId, "button", "border-color: " + toHex(panelBgColor, -50));
		}
	}
function addRule(stylesheetId, selector, rule) {
    var stylesheet = document.getElementById(stylesheetId);
    
    if (stylesheet) {
        stylesheet = stylesheet.sheet;
           if( stylesheet.addRule ){
               stylesheet.addRule(selector, rule);
           } else if( stylesheet.insertRule ){
               stylesheet.insertRule(selector + ' { ' + rule + ' }', stylesheet.cssRules.length);
           }
    }
	}
function reverseColor(color, delta) {
    return toHex({red:Math.abs(255-color.red), green:Math.abs(255-color.green), blue:Math.abs(255-color.blue)}, delta);
	}
/**
 * Convert the Color object to string in hexadecimal format;
 */
function toHex(color, delta) {
    function computeValue(value, delta) {
        var computedValue = !isNaN(delta) ? value + delta : value;
        if (computedValue < 0) {
            computedValue = 0;
        } else if (computedValue > 255) {
            computedValue = 255;
        }

        computedValue = Math.round(computedValue).toString(16);
        return computedValue.length == 1 ? "0" + computedValue : computedValue;
    }

    var hex = "";
    if (color) {
        with (color) {
             hex = computeValue(red, delta) + computeValue(green, delta) + computeValue(blue, delta);
        };
    }
    return "#" + hex;
	}
function onAppThemeColorChanged(event) {
    // Should get a latest HostEnvironment object from application.
    var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
    // Gets the style information such as color info from the skinInfo, 
    // and redraw all UI controls of your extension according to the style info.
    updateThemeWithAppSkinInfo(skinInfo);
	}
function loadPluginPresets(arbData){
	var csInterface = new CSInterface();
	var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION)+"";
	var folderPluginpresetsPath  = csInterface.getSystemPath(SystemPath.EXTENSION)+"/json/pluginPresets/";
	var plugIdStr = arbData.effectInfo.effectName.toString()+arbData.effectInfo.pluginVersion;

	var objData = {};
	objData.extensionPath =extensionPath;
	objData.folderPluginpresetsPath = folderPluginpresetsPath;
	objData.plugIdStr = plugIdStr;
	objDataStr = JSON.stringify (objData);
	csInterface.evalScript('$._ext.listJsonFiles('+objDataStr+')');
	}
function loadDefaultArb(){
	var csInterface = new CSInterface();
	var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/json/pluginPresets";
	var defaultArbFile  =extensionRoot+ "/tl_defaultPreset.JSON";
	var result =  window.cep.fs.readFile(defaultArbFile);
	if (result.err == 0) {
		return  result.data;
		}
	}
/**
 * Load JSX file into the scripting context of the product. All the jsx files in 
 * folder [ExtensionRoot]/jsx will be loaded. 
 */
function loadJSX() {
    var csInterface = new CSInterface();
	var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
	csInterface.evalScript('$._ext.evalFiles("' + extensionRoot + '")');
	}
function evalScript(script, callback) {
    new CSInterface().evalScript(script, callback);
	}
/*
function onClickButton(ppid) {
	var extScript = "$._ext_" + ppid + ".run()";
	evalScript(extScript);
}*/





