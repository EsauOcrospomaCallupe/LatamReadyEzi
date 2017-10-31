/**
 * Module Description
 * User Event para generacion automatica de asiento diario de traslado de IVA en pagos a proveedor.
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 set 2014     LatamReady Consultor
 * File : LMRY_BillPaymentURET.js
 */
var LMRY_script = "LMRY Vendor Payment URET";
//Declaracion de Variables
var objContext = nlapiGetContext(); 
var valorporc  = null;
var WTHolding  = null;
var valorporcA = null;
var WTHoldingA = null;
var valorporcB = null;
var WTHoldingB = null;
var correlativo  = null;
var correlativo1 = null;
var correlativo2 = null;
var correlativoA = null;
var correlativoB = null;
var fechaObtenida = null;
var auxiliarTieneDosTasas = '00';
var numeroActual = null;
var cantDigitos = null;
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function VPUret_BeforeLoad(type, form, request) {
	if ( type!='print' && type!='email' ) {
		var LMRY_Result = ValidateAccess( nlapiGetFieldValue('subsidiary') );
		if ( LMRY_Result[0]=='PE' && getAuthorization(1)==true && nlapiGetFieldValue('custbody_lmry_serie_retencion')!=null) 
		{
			onClick(type, form);
		}
		
		// Solo para Mexico
		if ( LMRY_Result[0]=='MX' ) 
		{
			// Lista de estado de proceso
			var procesado = nlapiGetFieldValue('custbody_lmry_schedule_transfer_of_iva');
			// Verifica si esta procesado y si esta activo el feature de bloqueo de transaccion
			if ( procesado==1 && getAuthorization(97) ) 
			{
				form.removeButton('edit');
			}
		}
	}
	// Si es nuevo, editado o copiado
	if ( type=='create' ||  type=='edit' || type=='copy') {
		if ( nlapiGetFieldValue('custbody_lmry_subsidiary_country')== '' ) {
			nlapiDisableField( 'custbody_lmry_subsidiary_country', false);	
		}
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function VPUret_BeforeSubmit(type) {
	try {
			nlapiLogExecution('ERROR', 'VPUret_BeforeSubmit: ', type);
		if ( type=='delete' ) 
		{
			var LMRY_RecoID = nlapiGetRecordId();
			var LMRY_Result = ValidateAccess( nlapiGetFieldValue('subsidiary') );

			// Solo para Peru - Retenciones
			if ( LMRY_Result[0]=='PE' && getAuthorization(1)==true ) {
				var serieCompr = nlapiGetFieldValue('custbody_lmry_serie_retencion');
				if ( serieCompr!=null && serieCompr!='' ){
					//ELIMINANDO DATOS DEL TIPO DE REGISTRO
					var columns = new Array();
						columns[0] = new nlobjSearchColumn('internalid');
					var filters = new Array();
						filters[0] = new nlobjSearchFilter('custrecord_lmry_pago_relacionado', null, 'anyof', LMRY_RecoID);
		
					var transacdata = nlapiSearchRecord('customrecord_lmry_comprobante_retencion', null, filters, columns);
					if(transacdata!=null){
						var longitud = transacdata.length;
						for(var cuenta=0; cuenta<longitud; cuenta++){
							var registro = nlapiLoadRecord('customrecord_lmry_comprobante_retencion', transacdata[cuenta].getValue('internalid'));
								registro.setFieldValue('inactive',true);
								registro.setFieldValue('isinactive','T');
							nlapiSubmitRecord(registro);
						}
					}
					
					//QUITANDO VALORES DE RETENCION A LAS TRANSACCIONES APLICADAS
					var cantAplic = nlapiGetLineItemCount('apply');
					for(var cuentaDocAplicado=1; cuentaDocAplicado<=cantAplic; cuentaDocAplicado++){
						if(nlapiGetLineItemValue('apply', 'apply', cuentaDocAplicado)=='T'){
							var vendorBillIdx = nlapiGetLineItemValue('apply','internalid',cuentaDocAplicado);
							// CARGAMOS LOS DATOS DE LA TRANSACCION
							var recSOx = 0;
							if(nlapiLookupField('vendorbill', vendorBillIdx,'entity')!=null || nlapiLookupField('vendorbill',vendorBillIdx,'account')!=null){
								recSOx = nlapiLoadRecord('vendorbill', vendorBillIdx);
								encontroTransaccion = true;
							}else{
								if(nlapiLookupField('vendorcredit', vendorBillIdx,'entity')!=null){
									recSOx = nlapiLoadRecord('vendorcredit', vendorBillIdx);
									encontroTransaccion = true;
								}else{
									if(nlapiLookupField('expensereport', vendorBillIdx,'entity')!=null){
										recSOx = nlapiLoadRecord('expensereport', vendorBillIdx);
										encontroTransaccion = true;
									}else{
										encontroTransaccion = false;
									}
								}
							}
							var cantItemx = recSOx.getLineItemCount('item');
							var cantExpnx = recSOx.getLineItemCount('expense');
							for(var a=1; a<=cantItemx; a++){
								recSOx.setLineItemValue('item','custcol_4601_witaxapplies',a,'F');
								recSOx.setLineItemValue('item','custcol_4601_witaxcode',a,'');///
								recSOx.setLineItemValue('item','custcol_4601_witaxrate',a,'');
								recSOx.setLineItemValue('item','custcol_4601_witaxbaseamount',a,'');
								recSOx.setLineItemValue('item','custcol_4601_witaxamount',a, '');
							}
							for(var b=1; b<=cantExpnx; b++){
								recSOx.setLineItemValue('expense','custcol_4601_witaxapplies',b,'F');
								recSOx.setLineItemValue('expense','custcol_4601_witaxcode',b,'');///
								recSOx.setLineItemValue('expense','custcol_4601_witaxrate',b,'');
								recSOx.setLineItemValue('expense','custcol_4601_witaxbaseamount',b,'');
								recSOx.setLineItemValue('expense','custcol_4601_witaxamount',b, '');
							}
							nlapiSubmitRecord(recSOx);
						}
					}
				}
			}			
		}
	} catch(err) {
		sendemail(' [ VPUret_BeforeSubmit ] ' +err, LMRY_script);		
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function VPUret_AfterSubmit(type){
	try {
			nlapiLogExecution('ERROR', 'VPUret_AfterSubmit: ', type);
		if ( type=='create' || type=='edit' )
		{
			var LMRY_Result = ValidateAccess( nlapiGetFieldValue('subsidiary') );
			var internalID 	=	nlapiGetRecordId();
			
			// Para Colombia, Bolivia y Paraguay - Enabled Feature WHT Latam
			/*if ( (LMRY_Result[0]=='CO' && getAuthorization(27)==true) ||
				 (LMRY_Result[0]=='BO' && getAuthorization(46)==true) ||
				 (LMRY_Result[0]=='PY' && getAuthorization(47)==true) ) 
			{
				var typeTrans = nlapiGetRecordType();
				//nlapiLogExecution('ERROR', 'typeTrans,nlapiGetRecordId()-->', typeTrans +','+ nlapiGetRecordId());
				Create_WHT_Payment_Latam('vendorpayment',nlapiGetRecordId());
			}*/
			
			// Solo para Peru - Retenciones en compras
			if ( type=='create' && LMRY_Result[0]=='PE' && getAuthorization(1)==true ) {				
				var variable = nlapiLoadRecord('vendorpayment',nlapiGetRecordId());
										

				var cantLineas = variable.getLineItemCount('apply');
				//para los pagos
				var montoTot =0;
				var montoTot2 =0;
					for(var cuenta=1; cuenta<=cantLineas; cuenta++){
						//nlapiLogExecution('ERROR', 'MONTOS PAGADOS EN LA TRANSACCION: ', nlapiGetLineItemValue('apply', 'internalid', cuenta));
						//nlapiGetLineItemValue('apply', 'amount', cuenta);
						if(variable.getLineItemValue('apply','apply',cuenta)=='T'){
							nlapiLogExecution('ERROR', 'DOCUMENTO APLICADO 1:', variable.getLineItemValue('apply', 'internalid', cuenta));
							
							var vendorBillIdx = variable.getLineItemValue('apply','internalid',cuenta);
							var vendorBillTe = nlapiLookupField('vendorbill',vendorBillIdx, ['entity','account']);

							if(vendorBillTe.entity!=null || vendorBillTe.account!=null){
								var recSOx = nlapiLoadRecord('vendorbill',vendorBillIdx);
								nlapiLogExecution('ERROR', 'TIPO DE TRANSACCION:', 'vendorbill');
								encontroTransaccion = true;
							}else{
								if(nlapiLookupField('vendorcredit',vendorBillIdx,'entity')!=null){
									var recSOx = nlapiLoadRecord('vendorcredit',vendorBillIdx);
									nlapiLogExecution('ERROR', 'TIPO DE TRANSACCION:', 'vendorcredit');
									encontroTransaccion = true;
								}else{
									if(nlapiLookupField('expensereport',vendorBillIdx,'entity')!=null){
										var recSOx = nlapiLoadRecord('expensereport',vendorBillIdx);
										nlapiLogExecution('ERROR', 'TIPO DE TRANSACCION:', 'expensereport');
										encontroTransaccion = true;
									}else{
										encontroTransaccion = false;
									}
								}
							}
							var tipoCambiofac = recSOx.getFieldValue('exchangerate');
							var montofac = parseFloat(recSOx.getFieldValue('usertotal'))*parseFloat(tipoCambiofac);
							if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){
								
								montoTot=montoTot+montofac;

							}
							var tipoDocumento = recSOx.getFieldValue('custbody_lmry_document_type');
							nlapiLogExecution('ERROR', 'TIPO DE DOCUMENTO:', tipoDocumento);
							if (tipoDocumento!=null) //DMC
								{
								//Tabla LatamReady - Pe Retenciones
								var filters = new Array();
									filters[0] = new nlobjSearchFilter('custrecord_lmry_pe_tipo_doc_fiscal', null, 'anyof', tipoDocumento)
								var columns = new Array();
									columns[0] = new nlobjSearchColumn('internalid');
								var RetencionesTL = nlapiSearchRecord('customrecord_lmry_pe_retenciones', null, filters, columns);
								
									if(RetencionesTL!=null && RetencionesTL!=''){
										var longitudRe = RetencionesTL.length;
										if(longitudRe>0){
											montoTot2= montoTot2+montofac;
										}
									}									
								}
							
						}
					}		
				var serieCompr = variable.getFieldValue('custbody_lmry_serie_retencion');
				
				buscaImpuestos();
				nlapiLogExecution('ERROR', 'IMPUESTOS ENCONTRADOS', valorporcA+' - '+valorporcB);
				
				if(serieCompr!=null && serieCompr!=''){
					buscaCorrelativo(serieCompr);
					var exchangeRT = variable.getFieldValue('exchangerate');
					var proveedor = variable.getFieldValue('entity');
					var datosproveedor = nlapiLookupField('vendor', proveedor, [ 'custentity_lmry_es_agente_retencion', 'custentity_lmry_es_buen_contribuyente', 'custentity_lmry_es_agente_percepcion', 'country' ] );
					
					
					if(datosproveedor==null){
						//VALIDA QUE NO SEA PROVEEDOR
						return true;
					}
					var esAgenteRetencion 	= datosproveedor.custentity_lmry_es_agente_retencion;
					var esBuenContribuyente = datosproveedor.custentity_lmry_es_buen_contribuyente;
					var esAgentePercepcion 	= datosproveedor.custentity_lmry_es_agente_percepcion;
					var countryVendor		= datosproveedor.country;
					var tipoCambio = variable.getFieldValue('exchangerate');
					var montoTotal = parseFloat(variable.getFieldValue('total'))*parseFloat(tipoCambio);
					nlapiLogExecution('ERROR', 'montoTotal', montoTotal);
					if((montoTot>700 && montoTot2>700)&& esAgenteRetencion!=1 && esAgentePercepcion!=1 && esBuenContribuyente!=1 && (countryVendor=='PE'||countryVendor==''||countryVendor==null)){
						var nuevoRegistro = nlapiCreateRecord('customrecord_lmry_comprobante_retencion');
							nuevoRegistro.setFieldValue('custrecord_lmry_serie_retencion', serieCompr);
							//nuevoRegistro.setFieldValue('custrecord_lmry_comp_retencion', numerCompr);
							nuevoRegistro.setFieldValue('custrecord_lmry_pago_relacionado', internalID);
							nuevoRegistro.setFieldValue('custrecord_lmry_tipo_cambio_pago', exchangeRT);
							nuevoRegistro.setFieldValue('custrecord_lmry_proveedor', proveedor);
						for(var cuenta=1; cuenta<=cantLineas; cuenta++){
							nlapiLogExecution('ERROR','cuenta:',cuenta);
							nlapiLogExecution('ERROR','CantLineas',cantLineas);
							//nlapiLogExecution('ERROR', 'MONTOS PAGADOS EN LA TRANSACCION: ', nlapiGetLineItemValue('apply', 'internalid', cuenta));
							//nlapiGetLineItemValue('apply', 'amount', cuenta);
							if(variable.getLineItemValue('apply','apply',cuenta)=='T'){
								nlapiLogExecution('ERROR', 'DOCUMENTO APLICADO 2: ', variable.getLineItemValue('apply', 'internalid', cuenta));
								
								var vendorBillIdx = variable.getLineItemValue('apply','internalid',cuenta);
								nuevoRegistro.setFieldValue('custrecord_lmry_transaccion_pagada', vendorBillIdx);
								var vendorBillTe = nlapiLookupField('vendorbill',vendorBillIdx, ['entity','account']);

								if(vendorBillTe.entity!=null || vendorBillTe.account!=null){
									var recSOx = nlapiLoadRecord('vendorbill',vendorBillIdx);
									encontroTransaccion = true;
								}else{
									if(nlapiLookupField('vendorcredit',vendorBillIdx,'entity')!=null){
										var recSOx = nlapiLoadRecord('vendorcredit',vendorBillIdx);
										encontroTransaccion = true;
									}else{
										if(nlapiLookupField('expensereport',vendorBillIdx,'entity')!=null){
											var recSOx = nlapiLoadRecord('expensereport',vendorBillIdx);
											encontroTransaccion = true;
										}else{
											encontroTransaccion = false;
										}
									}
								}
					
								var cantItemx = recSOx.getLineItemCount('item');
								var cantExpnx = recSOx.getLineItemCount('expense');
								//VALIDA SI ES LETRA O OTROS DOCUMENTOS AFECTOS A RETENCION
								var tipoDocumento = recSOx.getFieldValue('custbody_lmry_document_type');
								var tipoCambiofact = recSOx.getFieldValue('exchangerate');
								var montofactura = parseFloat(recSOx.getFieldValue('usertotal'))*parseFloat(tipoCambiofact);
								var valorRetenido = 0;
								//Tabla LatamReady - Pe Retenciones
								var filters = new Array();
									filters[0] = new nlobjSearchFilter('custrecord_lmry_pe_tipo_doc_fiscal', null, 'anyof', tipoDocumento)
								var columns = new Array();
									columns[0] = new nlobjSearchColumn('internalid');
								var RetencionesTL = nlapiSearchRecord('customrecord_lmry_pe_retenciones', null, filters, columns);
								var exitoRe=false;
								if(RetencionesTL!=null && RetencionesTL!=''){
									var longitudRe = RetencionesTL.length;
									if(longitudRe>0){
										exitoRe=true;
									}
								}

								//valida si el tipo de documento esta dentro de la tabla "LatamReady - Pe Retenciones :)"
								if(exitoRe){
									if(montofactura>700 || (montoTotal>700 && montofactura<700)){
										//variable de la factura
										//var variable = nlapiLoadRecord('vendorpayment',nlapiGetRecordId());
										nlapiLogExecution('ERROR', 'Tipo DE Documento', 'Factura');
										//Tipo de documento no sea Comprobante de No domiciliado
										var conProNoDoc =recSOx.getFieldText('custbody_lmry_document_type');
										nlapiLogExecution('ERROR', 'Campo No domiciliado', conProNoDoc);

										if(conProNoDoc!='Comprobante de No Domiciliado'){							
											// Tipo de Documento es Letra
											if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){
												if(tipoDocumento==135  ){
													nlapiLogExecution('ERROR', 'DOCUMENTO APLICADO:', 'ES LETRA');
													for(var a=1; a<=cantItemx; a++){
														var montoPagoTxAplicada    = recSOx.getLineItemValue('item', 'grossamt', a);
														var tipoDocTransaccPagada  = recSOx.getLineItemValue('item', 'custcol_lmry_exp_rep_type_doc',  a);
														var serieTransaccionPagada = recSOx.getLineItemValue('item', 'custcol_lmry_exp_rep_serie_doc', a);
														var numeroTransaccioPagada = recSOx.getLineItemValue('item', 'custcol_lmry_exp_rep_num_doc',   a);
														var montoTransaccionPagada = recSOx.getLineItemValue('item', 'custcol_lmry_doc_monto_origen',  a);
														var fechaDetalleLetraA 	   = recSOx.getLineItemValue('item', 'custcol_lmry_doc_fecha_origen',  a);
														validaFecha(fechaDetalleLetraA);
														var monedaTransaccioPagada = recSOx.getFieldValue('currency');
														nlapiLogExecution('ERROR', 'Datos del monto a pagar: ', montoTransaccionPagada + ' - ' + exchangeRT)
														//var montoFormula = parseFloat(montoTransaccionPagada)/((100-parseFloat(valorporc))/100)*(montoPagoTxAplicada/recSOx.getFieldValue('usertotal'));
														var montoFormula = variable.getLineItemValue('apply', 'amount', cuenta);
														nlapiLogExecution('ERROR', 'Datos del monto formula: ', montoFormula);
														//Monto Pago / (100%+tasa WHT) * importe de linea / importe total de documento (letra)
														nuevoRegistro.setFieldValue('custrecord_lmry_comp_retencion', correlativo);
														nuevoRegistro.setFieldValue('custrecord_lmry_fecha_transaccion_pagada', fechaDetalleLetraA);
														nuevoRegistro.setFieldValue('custrecord_lmry_doc_transaccion_pagada'  ,	tipoDocTransaccPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_serie_transaccion_pagada', serieTransaccionPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_numero_transaccion_pagad', numeroTransaccioPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_moneda_transaccion_pagad', monedaTransaccioPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_transaccion_pagada', parseFloat(montoTransaccionPagada)*parseFloat(exchangeRT));
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_pagado_transaccion', parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT));
														nuevoRegistro.setFieldValue('custrecord_lmry_tasa', valorporc);
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_formula', parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT));
														nlapiSubmitRecord(nuevoRegistro);
														
													}
													for(var b=1; b<=cantExpnx; b++){
														var montoPagoTxAplicada 	= recSOx.getLineItemValue('expense', 'grossamt', b);
														var tipoDocTransaccPagada 	= recSOx.getLineItemValue('expense', 'custcol_lmry_exp_rep_type_doc',	b);
														var serieTransaccionPagada 	= recSOx.getLineItemValue('expense', 'custcol_lmry_exp_rep_serie_doc',	b);
														var numeroTransaccioPagada 	= recSOx.getLineItemValue('expense', 'custcol_lmry_exp_rep_num_doc',	b);
														var montoTransaccionPagada 	= recSOx.getLineItemValue('expense', 'custcol_lmry_doc_monto_origen',	b);
														var fechaDetalleLetraB 		= recSOx.getLineItemValue('expense', 'custcol_lmry_doc_fecha_origen',	b);
														validaFecha(fechaDetalleLetraB);
														var monedaTransaccioPagada = recSOx.getFieldValue('currency');
														nlapiLogExecution('ERROR', 'Datos del monto a pagar: ', montoTransaccionPagada + ' - ' + exchangeRT);
														//var montoFormula = parseFloat(montoTransaccionPagada)/((100-parseFloat(valorporc))/100)*(montoPagoTxAplicada/recSOx.getFieldValue('usertotal'));
														var montoFormula = variable.getLineItemValue('apply', 'amount', cuenta);
														nlapiLogExecution('ERROR', 'Datos del monto formula: ', montoFormula);
														//Monto Pago / (100%+tasa WHT) * importe de linea / importe total de documento (letra)
														nuevoRegistro.setFieldValue('custrecord_lmry_comp_retencion', correlativo);
														nuevoRegistro.setFieldValue('custrecord_lmry_fecha_transaccion_pagada', fechaDetalleLetraB);
														nuevoRegistro.setFieldValue('custrecord_lmry_doc_transaccion_pagada'  ,	tipoDocTransaccPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_serie_transaccion_pagada', serieTransaccionPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_numero_transaccion_pagad', numeroTransaccioPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_moneda_transaccion_pagad', monedaTransaccioPagada);
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_transaccion_pagada', parseFloat(montoTransaccionPagada)*parseFloat(exchangeRT));
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_pagado_transaccion', parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT));
														nuevoRegistro.setFieldValue('custrecord_lmry_tasa', valorporc);
														nuevoRegistro.setFieldValue('custrecord_lmry_monto_formula', parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT));
														nlapiSubmitRecord(nuevoRegistro);
													}
												}else{
													nlapiLogExecution('ERROR', 'DOCUMENTO APLICADO:', 'NO ES LETRA');
													var valorFecha = recSOx.getFieldValue('trandate');
													validaFecha(valorFecha);
													
													var montoPagoTxAplicada = variable.getLineItemValue('apply', 'amount', cuenta);
													var montoPagoTxAplicadaDue = variable.getLineItemValue('apply', 'due', cuenta);
													var montoPagoTxAplicadaDisc = variable.getLineItemValue('apply', 'disc', cuenta);
													nlapiLogExecution('ERROR', 'Datos monto pagado: ', montoPagoTxAplicada + ' - ' + montoPagoTxAplicadaDue + ' - ' + montoPagoTxAplicadaDisc);
													var serieTransaccionPagada = recSOx.getFieldValue('custbody_lmry_serie_doc_cxp');
													var numeroTransaccioPagada = recSOx.getFieldValue('custbody_lmry_num_preimpreso');
													var monedaTransaccioPagada = recSOx.getFieldValue('currency');
													var montoTransaccionPagada = recSOx.getFieldValue('usertotal');
													nlapiLogExecution('ERROR','otros Datos',parseFloat(exchangeRT) + '-'+ parseFloat(valorporc));
													//nlapiLogExecution('ERROR', 'Datos de la formula: ', parseFloat(montoTransaccionPagada) + ' - ' + (100+valorporc) + ' - ' + ((100+valorporc)/100));
													var montoFormula = parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT)/((100-parseFloat(valorporc))/100); // / (100%+tasa WHT)
													nlapiLogExecution('ERROR', 'Datos del monto formula: ', montoFormula);
													nuevoRegistro.setFieldValue('custrecord_lmry_comp_retencion', correlativo);
													nuevoRegistro.setFieldValue('custrecord_lmry_fecha_transaccion_pagada', valorFecha);
													nuevoRegistro.setFieldValue('custrecord_lmry_doc_transaccion_pagada'  , tipoDocumento);
													nuevoRegistro.setFieldValue('custrecord_lmry_serie_transaccion_pagada', serieTransaccionPagada);
													nuevoRegistro.setFieldValue('custrecord_lmry_numero_transaccion_pagad', numeroTransaccioPagada);
													nuevoRegistro.setFieldValue('custrecord_lmry_moneda_transaccion_pagad', monedaTransaccioPagada);
													nuevoRegistro.setFieldValue('custrecord_lmry_monto_transaccion_pagada', parseFloat(montoTransaccionPagada)*parseFloat(exchangeRT));
													nuevoRegistro.setFieldValue('custrecord_lmry_monto_pagado_transaccion', parseFloat(montoPagoTxAplicada)*parseFloat(exchangeRT));
													nuevoRegistro.setFieldValue('custrecord_lmry_tasa', valorporc);
													nuevoRegistro.setFieldValue('custrecord_lmry_monto_formula', montoFormula);
													nlapiSubmitRecord(nuevoRegistro);
												}
											}
										}
									}
								}
										
							}
						}
						if(parseFloat(auxiliarTieneDosTasas)==1 || parseFloat(auxiliarTieneDosTasas)==10){
							nlapiSubmitField( 'customrecord_lmry_serie_compro_retencion', serieCompr , 'custrecord_lmry_valor_actual', parseFloat(numeroActual)+1 );
						}
						if(parseFloat(auxiliarTieneDosTasas)==11){
							nlapiSubmitField( 'customrecord_lmry_serie_compro_retencion', serieCompr , 'custrecord_lmry_valor_actual', parseFloat(numeroActual)+2 );
						}
					}
				}
			}		
		}	
	} catch(err){
		sendemail(' [ VPUret_AfterSubmit ] ' +err, LMRY_script);
		nlapiLogExecution('ERROR', 'error:' , err);
	}	
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Funciones solo para Peru - Retenciones:
 * 		- buscaCorrelativo
 * 		- asignaCorrelativo
 * 		- buscaImpuestos
 * 		- validaFecha
 * --------------------------------------------------------------------------------------------------- */
function buscaCorrelativo(idSerie){
	var seriecompret = nlapiLookupField('customrecord_lmry_serie_compro_retencion', idSerie, [ 'custrecord_lmry_valor_actual', 'custrecord_lmry_cant_digitos' ] );
	numeroActual = parseFloat(seriecompret.custrecord_lmry_valor_actual);
	cantDigitos  = seriecompret.custrecord_lmry_cant_digitos;
}
function asignaCorrelativo(valorCorrelativo){
	var stringCorrelativo = valorCorrelativo+'';
	var cadena = '0000000000';
		cadena = cadena + stringCorrelativo+'';
		cadena = cadena.substring(cadena.length-parseFloat(cantDigitos), cadena.length);
	return stringCorrelativo;
}
function buscaImpuestos(){
	var filtrosImpuestos = new Array();
		filtrosImpuestos[0] = new nlobjSearchFilter('custrecord_4601_wtc_description', null, 'contains', 'Retencion del IGV');
	var columnasImpuestos = new Array();
		columnasImpuestos[0] = new nlobjSearchColumn('custrecord_4601_wtc_effectivefrom');
		columnasImpuestos[1] = new nlobjSearchColumn('custrecord_4601_wtc_rate');
		columnasImpuestos[2] = new nlobjSearchColumn('internalid');
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
}
function validaFecha(valorFecha){
	if(nlapiStringToDate(valorFecha, 'date') < nlapiStringToDate(fechaObtenida, 'date')){
		valorporc = valorporcA+'';
		valorporc = valorporc.split('%')[0];
		WTHolding = WTHoldingA;
		auxiliarTieneDosTasas = '1'+auxiliarTieneDosTasas.substring(1, 2);
		if(correlativoA==null){
			if(correlativo1==null){
				correlativo1 = parseFloat(numeroActual)+1;
				correlativoA = asignaCorrelativo(correlativo1);
			}else{
				correlativo2 = parseFloat(numeroActual)+2;
				correlativoA = asignaCorrelativo(correlativo2);
			}
		}
		correlativo = correlativoA;
	}else{
		valorporc = valorporcB;
		valorporc = valorporc.split('%')[0];
		WTHolding = WTHoldingB;
		auxiliarTieneDosTasas = auxiliarTieneDosTasas.substring(0, 1)+'1';
		if(correlativoB==null){
			if(correlativo1==null){
				correlativo1 = parseFloat(numeroActual)+1;
				correlativoB = asignaCorrelativo(correlativo1);
			}else{
				correlativo2 = parseFloat(numeroActual)+2;
				correlativoB = asignaCorrelativo(correlativo2);
			}
		}
		correlativo = correlativoB;
	}
}

/* ------------------------------------------------------------------------------------------------------
 * A la variable featureId se le asigna el valore que le corresponde 
 * --------------------------------------------------------------------------------------------------- */
function ValidateAccess(ID) {
var LMRY_access = false;
var LMRY_countr = new Array();
var LMRY_Result = new Array();
	try{
		// Oculta todos los campos de cabecera Latam
		onFieldsHide(2);

		// Oculta todos los campos de Columna Latam
		onHiddenColumn();

		// Inicializa variables Locales y Globales
		LMRY_countr = Validate_Country(ID);

		// Verifica que el arreglo este lleno
		if ( LMRY_countr.length<1 ){
			return true;
		}
		LMRY_access = getCountryOfAccess(LMRY_countr);

		// Solo si tiene acceso
		if ( LMRY_access==true ) 
		{
			onFieldsDisplayBody( LMRY_countr[1], 'custrecord_lmry_on_bill_payment' );	
			
			// valida si es agente de rentencion
			var EsAgente = IsAgenteReten(ID);
			
			if (EsAgente=='F' || EsAgente=='f') {
				// Oculta el campo
				nlapiSetFieldDisplay('custbody_lmry_serie_retencion', false );
			}
			
			
		}

		// Asigna Valores
		LMRY_Result[0] = LMRY_countr[0];
		LMRY_Result[1] = LMRY_countr[1];
		LMRY_Result[2] = LMRY_access;
	} catch(err){
		nlapiLogExecution("ERROR","err-->", err);
		sendemail(' [ ValidateAccess ] ' +err, LMRY_script);
	}

	return LMRY_Result;
}

function IsAgenteReten(IdSubsidiary)
{
	var IsAgente = 'F';
   // nlapiLogExecution("ERROR","idSubsidiaria-->", IdSubsidiary);
	//if ( request.getMethod() == 'GET' ) {
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (featuresubs == true) {
			if (IdSubsidiary != '' && IdSubsidiary != null) {
				IsAgente = nlapiLookupField('subsidiary', IdSubsidiary, 'custrecord_lmry_agente_de_retencion');
			}
		}
		else
		{	IsAgente = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_agente_de_retencion'); }		
	//}
//	nlapiLogExecution("ERROR","suitelet_get_EsAgenteReten-->", IsAgente);
	
	return IsAgente;
}

function onClick(type,form){	
	var currentContext = nlapiGetContext();
	if ((currentContext.getExecutionContext() == 'userinterface') && (type == 'view') )
	 {		
		// Internal ID
		var recId = nlapiGetRecordId();		
		form.addButton('custpage_Add', 'Imprimir Comp. Retencion',"onclick_event();");
		form.setScript('customscript_lmry_retencionespagoclnt');
	 }
}