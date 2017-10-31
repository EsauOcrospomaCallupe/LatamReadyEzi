 /**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */

var UI, SEARCH, RECORD, RUNTIME, REDIRECT;
var LMRY_script = "LatamReady - PE EI Boleteo Masivo STLT";
var nameReport  = 'LatamReady - PE EI Boleteo Masivo';

define(["N/ui/serverWidget", "N/search", "N/runtime", "N/record", "N/redirect", "N/task"], runSuitelet);

function runSuitelet(ui, search, runtime, record, redirect, task)
{
	UI       = ui;
	SEARCH   = search;
	RUNTIME  = runtime;
	RECORD   = record;
	REDIRECT = redirect;
	TASK     = task;

	var returnObj = {};
		returnObj.onRequest = execute;
	return returnObj;
}

function execute(context)
{
	var method = context.request.method;
	var form   = UI.createForm(nameReport);
	var subsi  = RUNTIME.isFeatureInEffect({feature: "SUBSIDIARIES"});

	if (method == 'GET') {

		form.addFieldGroup({
				id : 'group_filter',
				label : 'PE EI - Filtros'
			});
		form.addFieldGroup({
				id : 'group_setup',
				label : 'PE EI - Setup'
			});

		var environment = form.addField({
				id : 'environment',
				type : UI.FieldType.TEXT,
				label : 'LATAM - NetSuite Environment',
				container: 'group_filter'
			});
			environment.defaultValue = RUNTIME.envType;
			environment.updateDisplayType({
				displayType : UI.FieldDisplayType.DISABLED
			});
		if (subsi) {
			var subsidiary = form.addField({
				id : 'subsidiary', 
				type : UI.FieldType.SELECT,
				label : 'LATAM - PE EI Subsidiary',
				source : 'subsidiary',
				container: 'group_filter'
			});
			subsidiary.isMandatory = true;
		}
		var serie = form.addField({
				id : 'serie', 
				type : UI.FieldType.SELECT,
				label : 'LATAM - PE EI Point of Sale',
				source : 'customrecord_lmry_serie_impresion_cxc',
				container: 'group_filter'
			});
			serie.isMandatory = true;
		var date_from = form.addField({
				id : 'date_from', 
				type : UI.FieldType.DATE,
				label : 'LATAM - PE EI Date From',
				container: 'group_filter'
			});
			date_from.isMandatory = true;
		var date_to = form.addField({
				id : 'date_to', 
				type : UI.FieldType.DATE,
				label : 'LATAM - PE EI Date To',
				container: 'group_filter'
			});
			date_to.isMandatory = true;
		var tab = form.addTab({
		    id : 'tab',
		    label : 'Tab'
		});

		var sublist = form.addSublist({
		    id : 'sublist',
		    type : UI.SublistType.STATICLIST,
		    //tab : 'tab',
		    label : 'Estado de envíos'
		});

		sublist.addRefreshButton();

		sublist.addField({id : 'lote', type : UI.FieldType.TEXT, label : 'Lote'});
		sublist.addField({id : 'created_date', type : UI.FieldType.TEXT, label : 'Fecha'});
		sublist.addField({id : 'subsidiary', type : UI.FieldType.TEXT, label : 'Subsidiaria'});
		sublist.addField({id : 'user', type : UI.FieldType.TEXT, label : 'Usuario'});
		sublist.addField({id : 'quantity', type : UI.FieldType.TEXT, label : 'Nro. Docs'});
		sublist.addField({id : 'status', type : UI.FieldType.TEXT, label : 'Estado'});
		sublist.addField({id : 'response', type : UI.FieldType.TEXT, label : 'Respuesta'});

		/* Búsqueda Personalizada LatamReady - PE EI Boleteo Masivo Log View */
		busqEnabFet = SEARCH.load({
			id: 'customsearch_lmry_pe_ei_bol_mas_log'
		});
		resultEnabFet = busqEnabFet.run().getRange(0, 1000);

		for ( var i = 0; resultEnabFet != null && i < resultEnabFet.length; i++){
			row  = resultEnabFet[i].columns;

			sublist.setSublistValue({id : 'lote', line : i, value : resultEnabFet[i].id});
			sublist.setSublistValue({id : 'created_date', line : i, value : resultEnabFet[i].getValue(row[0])});
			sublist.setSublistValue({id : 'subsidiary', line : i, value : resultEnabFet[i].getText(row[1])});
			sublist.setSublistValue({id : 'user', line : i, value : resultEnabFet[i].getText(row[2])});
			//sublist.setSublistValue({id : 'quantity', line : i, value : resultEnabFet[i].getValue(row[3])});
			log.error("quantity", resultEnabFet[i].getValue(row[3]));
			if (resultEnabFet[i].getValue(row[3]) != "") {
				log.error("Hola", "Hola");
				sublist.setSublistValue({id : 'quantity', line : i, value : resultEnabFet[i].getValue(row[3])});
			}
			sublist.setSublistValue({id : 'status', line : i, value : resultEnabFet[i].getValue(row[4])});
			//log.error("resultEnabFet[i].getValue(row[5])", resultEnabFet[i].getValue(row[5]));
			if (resultEnabFet[i].getValue(row[4]) != "Procesando") {
				sublist.setSublistValue({id : 'response', line : i, value : resultEnabFet[i].getValue(row[5])});
			}
			//sublist.setSublistValue({id : 'response', line : i, value : resultEnabFet[i].getValue(row[4]) != "Procesando" ? resultEnabFet[i].getValue(row[5]) : " "});
			//sublist.setSublistValue({id : 'response', line : i, value : resultEnabFet[i].getValue(row[4]) != "Procesando" ? resultEnabFet[i].getValue(row[5]) : " "});
			//sublist.setSublistValue({id : 'response', line : i, value : " "});
		}

		form.addSubmitButton('Generar');
		form.addResetButton('Cancelar');
		form.clientScriptModulePath = "SuiteBundles/Bundle 188371/LMRY_PE_EI_BOL_MAS_CLNT.js";
	}

	if (method == 'POST') {

		var params = {};

		params['custscript_lmry_pe_ei_date_from'] = context.request.parameters.date_from;
		params['custscript_lmry_pe_ei_date_to']   = context.request.parameters.date_to;
		params['custscript_lmry_pe_ei_serie']	  = context.request.parameters.serie;

		if (subsi) {
			params['custscript_lmry_pe_ei_subsidiary'] = context.request.parameters.subsidiary;
		}

		log.error("params", params);

		var task = TASK.create({
		    taskType: TASK.TaskType.SCHEDULED_SCRIPT,
		    scriptId: "customscript_lmry_pe_ei_bm_schdl",
		    deploymentId: "customdeploy_lmry_pe_ei_bm_schdl",
		    params: params
		});
		task.submit();

		log.error("task_status", task);

		log.error("RUNTIME.getCurrentScript().id", RUNTIME.getCurrentScript().id);
		log.error("RUNTIME.getCurrentScript().deploymentId", RUNTIME.getCurrentScript().deploymentId);

		REDIRECT.toSuitelet({
		    scriptId: RUNTIME.getCurrentScript().id,
		    deploymentId: RUNTIME.getCurrentScript().deploymentId
		});

	}

	context.response.writePage(form);
	//return;
}