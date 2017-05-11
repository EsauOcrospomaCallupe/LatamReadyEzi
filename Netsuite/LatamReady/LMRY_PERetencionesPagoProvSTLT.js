/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     Willy Carpio Godoy
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
var intMinReg = 0; 
var intMaxReg = 1000;
var bolStop	  = false;
var intMinRegER = 0; 
var intMaxRegER = 1000;
var bolStopER	  = false;
var objContext = nlapiGetContext();
var montoTotPago = 0;
var montoTotRetencion = 0;
//CAMPOS A PINTAR EN CABECERA
var cb_proveedor = "";
var cb_proveedorRuc = "";
var cb_fechaEmision = "";
var cb_serie = "";
var cb_correlativo = "";
var cb_tipoCambio = "";
//CAMPOS A PINTAR EN EL DETALLE
var ld_tipoDoc = "";
var ld_serieDoc = "";
var ld_numeroDoc = "";
var ld_fechaDoc = "";
var ld_valorDoc = "";
var ld_valorPagoDoc = "";
var ld_valorRetenido = "";
var ld_porcentaje = "";
//DATOS DE SERIE
var nroAutor	= "";
var rangoInic  	= "";
var rangoFinal 	= "";
var serieLabel 	= "";
var fechaVigencia = "";
//DATO SUBSIDIARIA
var nombreEmpresa = "";
var rucEmpresa = "";
var direccionEmpresa = "";
// Valida que exista registros
var swExist = false;
// Empieza las funciones y el proceso de Retenciones
function asignaCorrelativo(valorCorrelativo){
	var stringCorrelativo = valorCorrelativo+'';
	var cadena = 'A0000000000';
	cadena = cadena + stringCorrelativo+'';
	cadena = cadena.substring(cadena.length-7, cadena.length);
	return stringCorrelativo;
}

function datoSubsidiaria(IdSubsidiaria){
		nombreEmpresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_legalname_company');
		rucEmpresa	= nlapiGetContext().getSetting('SCRIPT', 'custscript_ruc_company');
		direccionEmpresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_ns_direccion_fiscal');	
}

function imprimirPDF(request, response){
	var recId = request.getParameter('id');	
	var recPO = nlapiLoadRecord('vendorpayment', recId);
	var fechaEmision = recPO.getFieldValue('trandate');
	
	if(nlapiStringToDate(fechaEmision, 'date') < nlapiStringToDate('01/05/2014', 'date')){
		imprimirOldPDF(request, response)
	}else{
		imprimirNewPDF(request, response);
	}	
}

function imprimirNewPDF(request, response){
	//AGREGADO 01/04
	var recId = request.getParameter('id');	
	var htmlFinal = "";
	datoSubsidiaria(null);
	var fechaInicial=null;
	var fechaFinal = null;
	
	var savedsearch = nlapiLoadSearch('customrecord_lmry_comprobante_retencion', 'customsearch_search_lmry_comp_retencion');
	savedsearch.addFilter(new nlobjSearchFilter('custrecord_lmry_pago_relacionado', null, 'anyof', recId, null));
	
	var objResultSet	= savedsearch.runSearch();
	var searchresult 	= objResultSet.getResults(intMinReg, intMaxReg);
	var auxCorrelativo = null;
	while(!bolStop){
		//return nlobjSearchResult
		
		for(var cuenta=0; cuenta<searchresult.length;cuenta++){
			swExist = true;
			nlapiLogExecution('ERROR','cuenta',cuenta);
			// Retorna las columnas
			var columns = searchresult[cuenta].getAllColumns();
			
			//CABECERA IZQUIERDO
			cb_proveedor 	= searchresult[cuenta].getValue(columns[15]);
			cb_proveedor 	= cb_proveedor.replace('&', 'Y');
			cb_proveedorRuc = searchresult[cuenta].getValue(columns[16]);
			cb_fechaEmision = searchresult[cuenta].getValue(columns[3]);
			//CABECERA DERECHO
			cb_serie		= searchresult[cuenta].getValue(columns[0]);
			cb_correlativo	= searchresult[cuenta].getValue(columns[1]);
			cb_tipoCambio 	= searchresult[cuenta].getValue(columns[12]);
			cb_tipoCambio   = parseFloat(cb_tipoCambio);
			//DETALLE
			ld_fechaDoc		= searchresult[cuenta].getValue(columns[5]);
			ld_tipoDoc 		= searchresult[cuenta].getValue(columns[7]);
			ld_serieDoc 	= searchresult[cuenta].getValue(columns[8]);
			ld_numeroDoc 	= searchresult[cuenta].getValue(columns[9]);
			ld_valorDoc 	= searchresult[cuenta].getValue(columns[11]);
			
			ld_valorPagoDoc = searchresult[cuenta].getValue(columns[18]);
			if(ld_valorPagoDoc==null||ld_valorPagoDoc==''){
				ld_valorPagoDoc = 0;
			}
			ld_valorPagoDoc = parseFloat(ld_valorPagoDoc);
			ld_valorPagoDoc = ld_valorPagoDoc.toFixed(2);
			nlapiLogExecution('ERROR', 'ld_valorPagoDoc',ld_valorPagoDoc);
			
			ld_porcentaje 	= searchresult[cuenta].getValue(columns[17]);
			ld_porcentaje 	= parseFloat(ld_porcentaje);
			nlapiLogExecution('ERROR', 'ld_porcentaje',ld_porcentaje);
			
			ld_valorRetenido= parseFloat(ld_porcentaje)*parseFloat(ld_valorPagoDoc)/100;
			ld_valorRetenido= ld_valorRetenido.toFixed(2);
			nlapiLogExecution('ERROR', 'ld_valorRetenido',ld_valorRetenido);
			
			//DATOS DE SERIE
			nroAutor	= searchresult[cuenta].getValue(columns[19]);
			rangoInic  	= searchresult[cuenta].getValue(columns[20]);
			rangoFinal 	= searchresult[cuenta].getValue(columns[21]);
			serieLabel 	= searchresult[cuenta].getValue(columns[22]);
			fechaVigencia = searchresult[cuenta].getValue(columns[23]);			
			
			if(cuenta!=0 && auxCorrelativo!=cb_correlativo){
				nlapiLogExecution('ERROR', 'FIN ARCHIVO','FIN ARCHIVO');
				htmlFinal += finArchivo();
			}
			if(auxCorrelativo!=cb_correlativo){

				nlapiLogExecution('ERROR', 'INICIO ARCHIVO','INICIO ARCHIVO');
				htmlFinal += inicioArchivo();
				htmlFinal += lineaDetalleCabecera();
				//nlapiLogExecution('ERROR', 'DETALLE ARCHIVO','DETALLE ARCHIVO');
				htmlFinal += lineaDetalle();
			}
			if(auxCorrelativo==cb_correlativo){
				nlapiLogExecution('ERROR', 'DETALLE ARCHIVO','DETALLE ARCHIVO');
				htmlFinal += lineaDetalle();
			}
			auxCorrelativo = cb_correlativo;
			montoTotPago = parseFloat(montoTotPago) + parseFloat(ld_valorPagoDoc);
			montoTotRetencion = parseFloat(montoTotRetencion) + parseFloat(ld_valorRetenido);
			//nlapiLogExecution('ERROR', 'Datos de fila '+(cuenta+1), columna0 + ' - ' + cb_correlativo);
			nlapiLogExecution('ERROR', 'montoTotPago',montoTotPago);
			nlapiLogExecution('ERROR', 'montoTotRetencion',montoTotRetencion);
		}
		nlapiLogExecution('ERROR', 'FIN ARCHIVO2','FIN ARCHIVO2');
		htmlFinal += finArchivo();
		nlapiLogExecution('ERROR', 'montoTotPagoOUT',montoTotPago);
		nlapiLogExecution('ERROR', 'montoTotRetencionOUT',montoTotRetencion);

		if(searchresult.length == 1000){
			intMaxReg = intMaxReg + 1000;
			intMinReg = intMinReg + 1000;
			searchresult = objResultSet.getResults(intMinReg, intMaxReg);
			if(searchresult.length == 1000){
				intMaxReg = intMaxReg + 1000;
				intMinReg = intMinReg + 1000;
				searchresult = objResultSet.getResults(intMinReg, intMaxReg);
			}else{
				bolStop = true;
			}
		}else{
			bolStop = true;
		}
	}
	var xml = "<?xml version=\"1.0\"?><!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">";
	xml +=	"<pdf><body font-size=\"12\"><h3></h3>"; 
	xml += "<p></p><table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
	xml += htmlFinal;
	xml += "</table></body></pdf>";
	
	// existen registros
	if (swExist)
	{
		var file = nlapiXMLToPDF( xml );
		response.setContentType('PDF','PO_Item_Barcode.pdf','inline');
		response.write( file.getValue() );
	}else{
		var strhtml =   "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
						"<tr>" +
							"<td class='text'>" +
							"<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">No Retiene</div>" +
							"</td>" +
						"</tr>" +
				  		"</table>";
		response.write(strhtml);
	}
}

function inicioArchivo(){
	var fechaLimite = nlapiGetContext().getSetting('SCRIPT', 'custscript_impr_ret_fecha_inicio_cambios');
	if(nlapiStringToDate(fechaLimite,'date') < nlapiStringToDate(cb_fechaEmision, 'date')){
		var empresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_impr_ret_nueva_razon_social');
	}else{
		var empresa = 'Colegios Peruanos S.A.C.';
	}
	var rucempresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_ruc_company');
	var direccionempresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_ns_direccion_fiscal');
	
	var html = "";
		html += "<tr><td height=\"500\"><table align=\"center\" style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:90%\">";
		//INICIO CABECERA
		html += "<tr>";
		//LADO IZQUIERDO CABECERA
		html += "<td style=\"font-size: 8pt\" valign=\"TOP\" width=\"70%\">";
		html += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:90%\">";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-weight: bold; font-size: 9pt\" align=\"center\" width=\"100%\">"+empresa+"</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-weight: bold; font-size: 7pt\" align=\"center\" width=\"100%\">Domicilio Fiscal: Jr. Carlos Villaran No. 140 Piso 7 - La Victoria</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"100%\"></td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"100%\">";
		html += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">Señor(es) </td>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+cb_proveedor+"</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">R.U.C. </td>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+cb_proveedorRuc+"</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">Fecha de Emision </td>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+cb_fechaEmision+"</td>";
		html += "</tr>";
		html += "</table>";
		html += "</td>";
		html += "</tr>";
		html += "</table>";
		html += "</td>";
		//LADO DERECHO CABECERA
		html += "<td style=\"font-size: 8pt\" width=\"30%\">";
		html += "<table border=\"1\" style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 7pt\" align=\"center\" width=\"100%\">R.U.C.: 20510713363 </td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 10pt\" align=\"center\" width=\"100%\">COMPROBANTE</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 10pt\" align=\"center\" width=\"100%\">DE RETENCION</td>";
		html += "</tr>";
		html += "<tr>";
		html += "<td style=\"text-align:center; font-size: 8pt\" align=\"center\" width=\"100%\">"+serieLabel+" - "+asignaCorrelativo(cb_correlativo)+"</td>";
		//html += "<td style=\"text-align:center; font-size: 8pt\" align=\"center\" width=\"100%\">"+cb_serie+" - "+asignaCorrelativo(cb_correlativo)+"</td>";
		html += "</tr>";
		html += "</table>";
		html += "</td>";
		//FIN DE CABECERA
		html += "</tr>";
	return html;
}
function lineaDetalleCabecera(){
	var html = "";
		html += "<tr>";
		html += "<td valign=\"TOP\" style=\"font-size: 8pt; border: 0px solid #ADADAD\" colspan=\"2\" width=\"100%\">";
		html += "<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
		//LINEA DEL TIPO DE CAMBIO
		html += "<tr>";
		html += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" colspan=\"5\" width=\"70%\"></td>";
		html += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"1\" width=\"15%\"></td>";
		html += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"1\" width=\"15%\">T.Cambio: "+cb_tipoCambio.toFixed(3)+"</td>";
		html += "</tr>";
		//LINEA CABECERA DETALLE A
		html += "<tr>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" colspan=\"5\" width=\"70%\">Comprobante de pago materia de retencion</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">Monto del pago</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">Retencion</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">%</td>";
		html += "</tr>";
		//LINEA CABECERA DETALLE B
		html += "<tr>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">TD</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Serie</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Numero</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">F. Emision</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Monto Total</td>";
		html += "</tr>";
	return html;
}

function lineaDetalle(){
	var html = "";
		html += "<tr>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
		html += ld_tipoDoc;//"00";//TIPODOCUMENTO
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
		html += ld_serieDoc;//"000";//SERIE DOCUMENTO 
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
		html += ld_numeroDoc;//"000000";//NUMERO DOCUMENTO
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
		html += ld_fechaDoc;//"00/00/0000";//FECHA DOCUMENTO
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
		html += ld_valorDoc;//"00.00";//VALOR DOCUMENTO
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"10%\">";
		html += ld_valorPagoDoc;//"00.00";//VALOR TOTAL PAGO
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"10%\">";
		html += ld_valorRetenido;//"00.00";//??
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"8%\">";
		html += ld_porcentaje;//"0%";//PORCENTAJE
		html += "</td>";
		html += "</tr>";
	return html;
	nlapiLogExecution('ERROR','ld_valorPagoDocDetalle',ld_valorPagoDoc);
	nlapiLogExecution('ERROR','ld_valorDocDetalle',ld_valorDoc);
	nlapiLogExecution('ERROR','ld_porcentajeDetalle',ld_porcentaje);
}

function finArchivo(){
	var html = "";
		//LINEA TOTALES DEL ARCHIVO
		html += "<tr>";
		html += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" colspan=\"4\"></td>";
		html += "<td style=\"font-size: 8pt; font-weight: bold; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">TOTALES</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
		montoTotPago = nlapiFormatCurrency(montoTotPago.toFixed(2));
		html += "S/. "+nlapiFormatCurrency(montoTotPago);
		html += "</td>";
		html += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
		montoTotRetencion = nlapiFormatCurrency(montoTotRetencion.toFixed(2));
		html += "S/. "+nlapiFormatCurrency(montoTotRetencion);
		html += "</td>";
		html += "</tr>";
		//LINEA DETALLE DE IMPRESION
		html += "<tr>";
		html += "<td style=\"text-align:left; font-size: 6pt\" align=\"left\" colspan=\"7\" width=\"100%\">Serie "+serieLabel+". Desde "+rangoInic+" hasta "+rangoFinal+". Aut.: "+nroAutor+". F.Vig.: "+fechaVigencia+"</td>";
		html += "</tr>";
		//FIN DETALLE
		html += "</table>";
		html += "</td></tr>";
		//FIN ARCHIVO
		html += "</table>";
		html += "</td></tr>";
		nlapiLogExecution('ERROR','montoTotPagoFin',montoTotPago);
		nlapiLogExecution('ERROR','montoTotRetencionFin',montoTotRetencion);
		montoTotPago = 0;
		montoTotRetencion = 0;
	return html;
}

function imprimirOldPDF(request, response){
	//VALIDANDO FECHAS DE CODIGO DE RETENCION
	var filtrosImpuestos = new Array();
	filtrosImpuestos[0] = new nlobjSearchFilter('custrecord_4601_wtc_description', null, 'contains', 'Retencion del IGV');
	var columnasImpuestos = new Array();
	columnasImpuestos[0] = new nlobjSearchColumn('custrecord_4601_wtc_effectivefrom');
	columnasImpuestos[1] = new nlobjSearchColumn('custrecord_4601_wtc_rate');
	columnasImpuestos[2] = new nlobjSearchColumn('internalid');
	
	//var valorporc = null;
	var WTHolding = null;
	var valorporcA = null;
	var WTHoldingA = null;
	var valorporcB = null;
	var WTHoldingB = null;
	var fechaObtenida = null;
	
	var transacdataImpuestos = nlapiSearchRecord('customrecord_4601_witaxcode', null, filtrosImpuestos, columnasImpuestos);
	for(var cuentaImpuesto = 0; cuentaImpuesto<transacdataImpuestos.length; cuentaImpuesto++){
		fechaObtenida = transacdataImpuestos[cuentaImpuesto].getValue('custrecord_4601_wtc_effectivefrom');
		if(fechaObtenida!='' && fechaObtenida!=null){
			valorporcB = transacdataImpuestos[cuentaImpuesto].getValue('custrecord_4601_wtc_rate');
			WTHoldingB = transacdataImpuestos[cuentaImpuesto].getValue('internalid');
		}else{
			valorporcA = transacdataImpuestos[cuentaImpuesto].getValue('custrecord_4601_wtc_rate');
			WTHoldingA = transacdataImpuestos[cuentaImpuesto].getValue('internalid');
		}
	}
	
	//AGREGADO 01/04
	var recId = request.getParameter('id');	
	var recPO = nlapiLoadRecord('vendorpayment', recId);
	var fechaEmision = recPO.getFieldValue('trandate');
	
	if(nlapiStringToDate(fechaemision, 'date') < nlapiStringToDate(fechaObtenida, 'date')){
		valorporc = valorporcA+'';
		valorporc = valorporc.split('%')[0];
		WTHolding = WTHoldingA;
	}else{
		valorporc = valorporcB;
		valorporc = valorporc.split('%')[0];
		WTHolding = WTHoldingB;
	}
	
	
	//var recId = request.getParameter('id');	
	//var recPO = nlapiLoadRecord('vendorpayment', recId);
	var lineCount = recPO.getLineItemCount('apply');
	var lineCountCredit = recPO.getLineItemCount('credit');
	
	var entidad = recPO.getFieldValue('entity');
	var datosVendor =  nlapiLookupField('vendor',entidad,['companyname', 'vatregnumber']);
	var nombres =datosVendor.companyname;
	var nombres = nombres.replace("&","Y");
	var vendorvatreg = datosVendor.vatregnumber;
	//var fechaEmision = recPO.getFieldValue('trandate');
	
	//var WTHolding = nlapiLookupField('vendor',entidad,'custentity_4601_defaultwitaxcode');
	//var porcentaje = nlapiLookupField('customrecord_4601_witaxcode',WTHolding,'custrecord_4601_wtc_rate');
	//var porc = porcentaje.split('%');
	//var valorporc = parseFloat(porc[0]);
	var tipoCambio = recPO.getFieldValue('exchangerate');
	
	var empresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_legalname_company');
	var rucempresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_ruc_company');
	var direccionempresa = nlapiGetContext().getSetting('SCRIPT', 'custscript_ns_direccion_fiscal');
	
	var simboloMoneda = '';
	
	if(recPO.getFieldValue('currency')=='1'){
		simboloMoneda = 'S/.';
	}else{
		simboloMoneda = 'USD';
	}
	
	var IdSerie = recPO.getFieldValue('custbody_ns_serie_impresion_retenc');
	var Serie = recPO.getFieldText('custbody_ns_serie_impresion_retenc');	
	if(IdSerie!=null && IdSerie!=''){
		var datosIdSerie = nlapiLookupField('customrecord_ns_serie_comp_retenc',IdSerie,['custrecord_ns_nro_autorizacion','custrecord_ns_nro_autorizacion','custrecord_ns_valor_minimo','custrecord_ns_valor_maximo','custrecord_etiqiueta_impresion','custrecord_ns_fecha_vigencia']);
		var nroAutor= datosIdSerie.custrecord_ns_nro_autorizacion;
		var rangoInic  = datosIdSerie.custrecord_ns_valor_minimo;
		var rangoFinal = datosIdSerie.custrecord_ns_valor_maximo;
		var serieLabel = datosIdSerie.custrecord_etiqiueta_impresion;
		var fechaVigencia = datosIdSerie.custrecord_ns_fecha_vigencia;
	}else{
		var nroAutor= '--';
		var rangoInic  = '--';
		var rangoFinal = '--';
	}	
	
	// -------------------------------------------------------------------------------------------------------	
// Inicio de la CreaciÃƒÂ³n de Factura Impresa
	var strName = "";
	strName +="<table align=\"center\" style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:90%\">";
		strName += "<tr>";
			strName += "<td style=\"font-size: 8pt\" width=\"70%\">"
			//LADO IZQUIERDO
				strName +="<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:90%\">";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-weight: bold; font-size: 9pt\" align=\"center\" width=\"100%\">"+empresa+"</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-weight: bold; font-size: 7pt\" align=\"center\" width=\"100%\">Domicilio Fiscal: "+direccionempresa+"</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"100%\"></td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"100%\">";
							strName +="<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
								strName += "<tr>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">Señor(es) </td>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+nombres+"</td>";
								strName += "</tr>";
								strName += "<tr>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">R.U.C. </td>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+vendorvatreg+"</td>";
								strName += "</tr>";
								strName += "<tr>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"30%\">Fecha de Emision </td>";
									strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"left\" width=\"70%\">:   "+fechaEmision+"</td>";
								strName += "</tr>";
							strName += "</table>";
						strName += "</td>";
					strName += "</tr>";
				strName += "</table>";
			strName += "</td>";
			//LADO IZQUIERDO
			strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"30%\">";
			//LADO DERECHO
				strName +="<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 7pt\" align=\"center\" width=\"100%\">R.U.C.: 20510713363</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 10pt\" align=\"center\" width=\"100%\">COMPROBANTE</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 10pt\" align=\"center\" width=\"100%\">DE RETENCION</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"text-align:center; font-size: 8pt\" align=\"center\" width=\"100%\">"+serieLabel+" - "+recPO.getFieldValue('custbody_ns_nro_comp_retenc')+"</td>";
					strName += "</tr>";
				strName += "</table>";
			strName += "</td>";
			//LADO DERECHO
		strName += "</tr>";
		strName += "<tr>";
			strName += "<td style=\"font-size: 8pt; \" colspan=\"3\" width=\"50%\"></td>";
		strName += "</tr>";
		//LADO DEL DETALLE
		strName += "<tr>";
			strName += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" colspan=\"2\" width=\"100%\">";
				strName +="<table style=\"font-family: Verdana, Arial, Helvetica, sans-serif; width:100%\">";
					if(tipoCambio!=1 || tipoCambio!='1'){
						strName += "<tr>";
							strName += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" colspan=\"5\" width=\"70%\"></td>";
							strName += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"1\" width=\"15%\"></td>";
							strName += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"1\" width=\"15%\">T.Cambio: "+tipoCambio+"</td>";
						strName += "</tr>";
					}
					strName += "<tr>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" colspan=\"5\" width=\"70%\">Comprobante de pago materia de retencion</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">Monto del pago</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">Retencion</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" valign=\"middle\" rowspan=\"2\" width=\"10%\">%</td>";
					strName += "</tr>";
					strName += "<tr>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">TD</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Serie</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Numero</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">F. Emision</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">Monto Total</td>";
					strName += "</tr>";
					var totMonto = 0;
					var totReten = 0;
					for (var x=1; x <= lineCount; x++){
							
						if(recPO.getLineItemValue('apply','apply',x)=='T'){
							var idDoc = recPO.getLineItemValue('apply','internalid',x);
							var factura = nlapiCopyRecord('vendorbill',idDoc);
							var fechaemision = nlapiLookupField('vendorbill', idDoc,'trandate');
							var idTipoDoc = factura.getFieldValue('custbody_tipo_doc_cxp');
							var esLetra = nlapiLookupField('customrecord_tipo_doc_cxc', idTipoDoc,'custrecord_es_letra_cxc');
							if(nlapiStringToDate(fechaemision, 'date') < nlapiStringToDate(fechaObtenida, 'date')){
								valorporc = valorporcA+'';
								valorporc = valorporc.split('%')[0];
								WTHolding = WTHoldingA;
							}else{
								valorporc = valorporcB;
								valorporc = valorporc.split('%')[0];
								WTHolding = WTHoldingB;
							}
							//SI TRANSACCION PAGADA NO ES LETRA
							if(esLetra!='T'){
								swExist = true;
								// Detalle
								strName += "<tr>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										var idTipoDocArticulo = factura.getFieldValue('custbody_tipo_doc_cxp');
										var tipoDocArticulo = nlapiLookupField('customrecord_tipo_doc_cxc', idTipoDocArticulo, 'custrecord_tipo_doc_sunat_cxc');
										strName += tipoDocArticulo;
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										strName += factura.getFieldValue('custbody_serie_doc'); 
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										strName += factura.getFieldValue('custbody_numero_doc');
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										strName += fechaemision;//factura.getFieldValue('trandate');
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
										strName += (factura.getFieldValue('usertotal') * tipoCambio).toFixed(2);
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"10%\">";
										//var total = parseFloat(recPO.getLineItemValue('apply','amount',x)) + parseFloat(recPO.getLineItemValue('apply','total',x)) - parseFloat(recPO.getLineItemValue('apply','due',x));;
										var total = parseFloat(recPO.getLineItemValue('apply','amount',x));
										var diferencia = (parseFloat(recPO.getLineItemValue('apply','amount',x))*valorporc)/(100-valorporc);
										total = parseFloat(total.toFixed(2)) + parseFloat(diferencia.toFixed(2));
										strName += (total*tipoCambio).toFixed(2);
										totMonto += parseFloat((total*tipoCambio).toFixed(2));// + parseFloat(diferencia.toFixed(2));
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"10%\">";
										//var diferencia = parseFloat(recPO.getLineItemValue('apply','total',x)) - parseFloat(recPO.getLineItemValue('apply','due',x));
										
										//var diferencia = diferencia.toFixed(2);
										strName += (diferencia*tipoCambio).toFixed(2);
										totReten += parseFloat((diferencia*tipoCambio).toFixed(2));
									strName += "</td>";
									strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"8%\">";
										strName += valorporc+'%';
									strName += "</td>";
									strName += "</tr>";
							}else{
								//SI TRANSACCION PAGADA ES LETRA
								var itemFactura = factura.getLineItemCount('item');
								for (var y=1; y <= itemFactura; y++){
									strName += "<tr>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										//var idTipoDocLetra = factura.getLineItemValue('item','custcoltd_origen_letra',y);
										var idTipoDocLetra = factura.getLineItemValue('item','custcol_tipo_doc_ref_letra',y);
										if(idTipoDocLetra==null){
											var tipoDocLetra = '00';
										}else{
											var tipoDocLetra = nlapiLookupField('customrecord_tipo_doc_cxc',idTipoDocLetra,'custrecord_tipo_doc_sunat_cxc');
										}
										
										strName += tipoDocLetra;
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										//strName += factura.getLineItemValue('item','custcolserie_origen_letra',y);
										strName += factura.getLineItemValue('item','custcol_serie_doc_ref_letra',y);
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										//strName += factura.getLineItemValue('item','custcolnumdoc_origen_letra',y);
										strName += factura.getLineItemValue('item','custcol_nro_doc_ref_letra',y);
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
										//strName += factura.getLineItemValue('item','custcolfemision_origen_letra',y);
										strName += factura.getLineItemValue('item','custcol_fecha_doc_ref_letra',y);
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
										//strName += factura.getLineItemValue('item','custcolmonto_origen_letra',y);
										strName += ((parseFloat(factura.getLineItemValue('item','custcol_monto_doc_ref_letra',y)))*tipoCambio).toFixed(2);
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
										var total = parseFloat(factura.getLineItemValue('item','rate',y))*tipoCambio;
										strName += total.toFixed(2);
										totMonto += parseFloat(total);
										strName += "</td>";
										strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
										var retenido = (parseFloat(factura.getLineItemValue('item','rate',y))*valorporc)/(100);
										retenido = retenido*tipoCambio;
										strName += retenido.toFixed(2);
										totReten += parseFloat(retenido.toFixed(2));
										strName += "</td>";
									strName += "</tr>";
								}
							}
						}
					}
					
					for (var contNC = 1; contNC <= lineCountCredit; contNC++){
						if(recPO.getLineItemValue('credit','applydir2',contNC)=='T'){
							strName += "<tr>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"center\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
								strName += "</td>";
								strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
								strName += "</td>";
							strName += "</tr>";
						}
					}
					
					strName += "<tr>";
						strName += "<td style=\"font-size: 8pt; border: 0px solid #ADADAD\" align=\"center\" colspan=\"4\"></td>";
						strName += "<td style=\"font-size: 8pt; font-weight: bold; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">TOTALES</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
						strName += "S/. "+totMonto.toFixed(2);
						strName += "</td>";
						strName += "<td style=\"font-size: 8pt; border: 1px solid #ADADAD\" align=\"right\" width=\"14%\">";
						strName += "S/. "+totReten.toFixed(2);
						strName += "</td>";
					strName += "</tr>";
					strName += "<tr>";
											
						//var fechaVigencia = nlapiLookupField('customrecord_ns_serie_comp_retenc',IdSerie,'custrecord_ns_fecha_vigencia');
						//strName += "<td style=\"text-align:left; font-size: 6pt\" align=\"left\" colspan=\"7\" width=\"100%\">Serie "+Serie+". Desde "+rangoInic+" hasta "+rangoFinal+". Aut.: "+nroAutor+". F.Vig.: "+fechaVigencia+"</td>";
						strName += "<td style=\"text-align:left; font-size: 6pt\" align=\"left\" colspan=\"7\" width=\"100%\">Serie "+serieLabel+". Desde "+rangoInic+" hasta "+rangoFinal+". Aut.: "+nroAutor+". F.Vig.: "+fechaVigencia+"</td>";//01/11/2012</td>";
						//strName += "<font size=4>Nro. Aut. Imp.: "+nroAutor+"</font>";
					strName += "</tr>";
				strName += "</table>";
			strName += "</td>";
		strName += "</tr>";
	strName += "</table>";
	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml +=	"<pdf>\n<body font-size=\"12\">\n<h3></h3>\n"; 
	xml += "<p></p>";
	xml += strName;
	xml += "</body>\n</pdf>";
	
	// existen registros
	if (swExist)
	{
		var file = nlapiXMLToPDF( xml );
		response.setContentType('PDF','PO_Item_Barcode.pdf','inline');
		response.write( file.getValue() );
	}else{
		var strhtml =   "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
						"<tr>" +
							"<td class='text'>" +
							"<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Important: By using the NetSuite Transaction, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.</div>" +
							"</td>" +
						"</tr>" +
				  		"</table>";
		response.write(strhtml);
	}
}

//Funcion que devuelve el numero con 2 decimales
function NumeroDec(par_mon) {

	// Ubica el punto
	var Numero  = par_mon.toString();
	var mon_pos = Numero.lastIndexOf('.');
	var mon_len = Numero.length;
	var mon_aux = parseInt(mon_pos)+3
		
	// si no existe punto en el numero
	if (parseInt(mon_pos) == -1) {
		var mon_ent = Numero;
		var mon_dec = '.00';

		// devuelve el monto final
		var mon_fin = mon_ent+mon_dec;

	} else {
		// Si existe punto en el numero
		if (mon_aux==mon_len) {
			// devuelve el monto final
			var mon_fin = par_mon;
		} else {
			// Numero entero
			var mon_ent = Numero.substring(0,mon_pos);
			// Numero decimal
			var mon_dec = Numero.substring(mon_pos);
			 
			// Para el redondeo - obtener el 3er decimal
			var mon_tre = mon_dec.substring(3);
			var mon_tre = mon_tre.substring(0,1);
			
			if (parseInt(mon_tre)>4) {				
				mon_dec = 1+mon_dec
				var mon_dec = parseFloat(mon_dec)+0.01
				var mon_dec = mon_dec.toString();
				// Verifica si se redondea el entero
				if (mon_dec.substring(0,1)=='2') {
					var mon_ent = parseFloat(mon_ent)+1
				}
				var mon_dec = mon_dec.substring(1);
				var mon_dec = mon_dec.substring(0,3);

				// devuelve el monto final
				var mon_fin = mon_ent+mon_dec;
			} else {
				// Verifica si tiene solo un decimal
				mon_dec = mon_dec.substring(0,3);
				mon_pos = mon_dec.length;
				if (parseInt(mon_pos) == 2) {
					mon_dec = mon_dec+'0';

					// devuelve el monto final
					var mon_fin = mon_ent+mon_dec;
				} else {					
					// devuelve el monto final
					var mon_fin = mon_ent+mon_dec;
				} 
			}
		}
	}
	// la funcion retorna el importe final
	return mon_fin.toString();
}

function formatearMontos(num,prefix){
	 prefix = prefix || '';
	 num += '';
	 // Declaramos variables
	 var splitStr = num.split('.');
	 var splitLeft = splitStr[0];
	 var splitRight = splitStr.length > 1 ? '.' + splitStr[1] : '';
	 var regx = /(\d+)(\d{3})/;
	 // Formatea Numero
	 while (regx.test(splitLeft)) {
	  splitLeft = splitLeft.replace(regx, '$1' + ',' + '$2');
	 }
	 return prefix + splitLeft + splitRight;
}

function ConvNumeroLetraESP(montoTotal,monedaTexto,iniciales){
	
	//Comienza la conversion de numeros a letras
	montoTotal = montoTotal + '';//volviendolo texto
	var MontoEnTexto = '';
	var MontoEntero = '';
	var MontoDecimal = '';
	var unidades = new Array('MIL','MILLONES');
	//nlapiLogExecution('DEBUG', 'montoTotal', 'montoTotal: '+ montoTotal);
	//llenando Enteros y decimales
	var aux = 1; //uno es cuando se esta del lado entero
	for (var i = 0; i < montoTotal.length; i++) {
		var charMonto = montoTotal.substr(i, 1);
		if (charMonto == '.') {
			aux = 2;//Cambiamos de valor para saber donde comienza el lado decimal
		}
		if (aux == 1) {
			MontoEntero += charMonto;
		}
		else {
			MontoDecimal += charMonto;
		}
	}
	//si la longitud de la parte decimal es menor a 3, se completa con un cero a la derecha
	if (MontoDecimal.length == 2)
	{
		MontoDecimal = MontoDecimal+'0';
	}
	MontoDecimal = MontoDecimal.substr(1, 2);
	if(MontoDecimal==''){ MontoDecimal='00';}
	//Empezamos a trabajar con el numero Entero puesto que el decimal quedo ya definido
	var cantGrupos = parseInt(MontoEntero.length / 3);
	var grupoInicial = ''
	if (MontoEntero.length % 3 != 0) {
		grupoInicial = MontoEntero.substr(0, MontoEntero.length % 3);
	}
	var grupo = new Array();
	if (cantGrupos > 0) {
		for (var j = 1; j <= cantGrupos; j++) {
			grupo[j - 1] = MontoEntero.substr((MontoEntero.length - 3 * j), 3);
		}
	}
	//si hay valor en el grupo inicial lo volvemos parte del grupo del Array
	if (grupoInicial != '') {
		grupo[grupo.length] = grupoInicial;
	}
	//Ya tenemos los grupos de derecha a izquierda (de la posicion grupo[0] a grupo[longitud]
	var textoGrupoNumero = new Array();
	for (var k = 0; k < grupo.length; k++) {
		if(grupo[k].length==3){
			textoGrupoNumero[k] = '';
			var text3 = ''
			var text2 = ''
			var text1 = ''
			var flag0 = ''
			switch(parseInt(grupo[k].substr(2,1))){
				case 0: flag0 = '1';break;
				case 1: text3 = 'UNO';break;
				case 2: text3 = 'DOS';break;
				case 3: text3 = 'TRES';break;
				case 4: text3 = 'CUATRO';break;
				case 5: text3 = 'CINCO';break;
				case 6: text3 = 'SEIS';break;
				case 7: text3 = 'SIETE';break;
				case 8: text3 = 'OCHO';break;
				case 9: text3 = 'NUEVE';break;
			}
			switch(parseInt(grupo[k].substr(1,2))){
				case 10: text3 = 'DIEZ';break;
				case 11: text3 = 'ONCE';break;
				case 12: text3 = 'DOCE';break;
				case 13: text3 = 'TRECE';break;
				case 14: text3 = 'CATORCE';break;
				case 15: text3 = 'QUINCE';break;
				case 16: text3 = 'DIECISEIS';break;
				case 17: text3 = 'DIECISIETE';break;
				case 18: text3 = 'DIECIOCHO';break;
				case 19: text3 = 'DIECINUEVE';break;
				case 20: text3 = 'VEINTE';break;
				case 21: text3 = 'VEINTIUNO';break;
				case 22: text3 = 'VEINTIDOS';break;
				case 23: text3 = 'VEINTITRES';break;
				case 24: text3 = 'VEINTICUATRO';break;
				case 25: text3 = 'VEINTICINCO';break;
				case 26: text3 = 'VEINTISEIS';break;
				case 27: text3 = 'VEINTISIETE';break;
				case 28: text3 = 'VEINTIOCHO';break;
				case 29: text3 = 'VEINTINUEVE';break;
			}
			switch(parseInt(grupo[k].substr(1,1))){
				case 3: text2 = 'TREINTA';break;
				case 4: text2 = 'CUARENTA';break;
				case 5: text2 = 'CINCUENTA';break;
				case 6: text2 = 'SESENTA';break;
				case 7: text2 = 'SETENTA';break;
				case 8: text2 = 'OCHENTA';break;
				case 9: text2 = 'NOVENTA';break;
			}
			if(parseInt(grupo[k].substr(2,1))!=0&& text2!=''){
				text2 += ' Y ';
			}
			if(parseInt(grupo[k].substr(0,3))==100){
				text3 = 'CIEN'
			}else{
				switch(parseInt(grupo[k].substr(0,1))){
					case 1: text1 = 'CIENTO';break;
					case 2: text1 = 'DOSCIENTOS';break;
					case 3: text1 = 'TRESCIENTOS';break;
					case 4: text1 = 'CUATROCIENTOS';break;
					case 5: text1 = 'QUINIENTOS';break;
					case 6: text1 = 'SEISCIENTOS';break;
					case 7: text1 = 'SETECIENTOS';break;
					case 8: text1 = 'OCHOCIENTOS';break;
					case 9: text1 = 'NOVECIENTOS';break;
				}
			}			
			textoGrupoNumero[k] = text1+' '+text2+text3;
		}else{
			textoGrupoNumero[k] = '';
			var text3 = ''
			var text2 = ''
			var flag0 = ''
			if (grupo[k].length == 1) {
				switch(parseInt(grupo[k].substr(0,1))){
					case 0: flag0 = '1';break;
					case 1: text3 = 'UN';break;
					case 2: text3 = 'DOS';break;
					case 3: text3 = 'TRES';break;
					case 4: text3 = 'CUATRO';break;
					case 5: text3 = 'CINCO';break;
					case 6: text3 = 'SEIS';break;
					case 7: text3 = 'SIETE';break;
					case 8: text3 = 'OCHO';break;
					case 9: text3 = 'NUEVE';break;
				}
				textoGrupoNumero[k] =text3;
			}else{
				switch(parseInt(grupo[k].substr(1,1))){
					case 0: flag0 = '1';break;
					case 1: text3 = 'UNO';break;
					case 2: text3 = 'DOS';break;
					case 3: text3 = 'TRES';break;
					case 4: text3 = 'CUATRO';break;
					case 5: text3 = 'CINCO';break;
					case 6: text3 = 'SEIS';break;
					case 7: text3 = 'SIETE';break;
					case 8: text3 = 'OCHO';break;
					case 9: text3 = 'NUEVE';break;
				}
				switch(parseInt(grupo[k].substr(0,2))){
					case 10: text3 = 'DIEZ';break;
					case 11: text3 = 'ONCE';break;
					case 12: text3 = 'DOCE';break;
					case 13: text3 = 'TRECE';break;
					case 14: text3 = 'CATORCE';break;
					case 15: text3 = 'QUINCE';break;
					case 16: text3 = 'DIECISEIS';break;
					case 17: text3 = 'DIECISIETE';break;
					case 18: text3 = 'DIECIOCHO';break;
					case 19: text3 = 'DIECINUEVE';break;
					case 20: text3 = 'VEINTE';break;
					case 21: text3 = 'VEINTIUNO';break;
					case 22: text3 = 'VEINTIDOS';break;
					case 23: text3 = 'VEINTITRES';break;
					case 24: text3 = 'VEINTICUATRO';break;
					case 25: text3 = 'VEINTICINCO';break;
					case 26: text3 = 'VEINTISEIS';break;
					case 27: text3 = 'VEINTISIETE';break;
					case 28: text3 = 'VEINTIOCHO';break;
					case 29: text3 = 'VEINTINUEVE';break;
				}
				switch(parseInt(grupo[k].substr(0,1))){
					case 3: text2 = 'TREINTA';break;
					case 4: text2 = 'CUARENTA';break;
					case 5: text2 = 'CINCUENTA';break;
					case 6: text2 = 'SESENTA';break;
					case 7: text2 = 'SETENTA';break;
					case 8: text2 = 'OCHENTA';break;
					case 9: text2 = 'NOVENTA';break;
				}
				/*if(parseInt(grupo[k].substr(2,1))!=0 && text2!=''){
				text2 += ' Y ';
				}*/
				if(flag0 != '1' && text2!=''){
					text2 += ' Y ';
				}
				textoGrupoNumero[k] =text2+text3;
			}
		}
	}
	var mensaje = '';
	for(var m=0;m<textoGrupoNumero.length;m++){
		if (m == 0) {
			mensaje = textoGrupoNumero[m] + mensaje;
		}else{
			if (textoGrupoNumero[m]=='UN' && unidades[m-1]=='MILLONES') {
				mensaje = textoGrupoNumero[m] + ' MILLON ' + mensaje;
			} else {
				mensaje = textoGrupoNumero[m] + ' ' + unidades[m-1] + ' ' + mensaje;
			}
		}
	}
	mensaje = mensaje+' '+monedaTexto.toUpperCase()+' '+MontoDecimal+'/100 '+iniciales.toUpperCase();
	return mensaje;
}