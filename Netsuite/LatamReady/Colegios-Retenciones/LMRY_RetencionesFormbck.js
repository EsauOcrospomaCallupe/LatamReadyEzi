/**
* @author WCARPIO @One System
* Script para realizar retencion durante el desembolso de ser necesario
*/
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

function asignaCorrelativo(valorCorrelativo){
	var stringCorrelativo = valorCorrelativo+'';
	var cadena = '0000000000';
		cadena = cadena + stringCorrelativo+'';
		cadena = cadena.substring(cadena.length-parseFloat(cantDigitos), cadena.length);
	return stringCorrelativo;
}

function beforeSubmitRetencion(){
	if(nlapiGetRecordId()=='' || nlapiGetRecordId()==null){
		//VALIDACION SOLO PARA FACTURAS POR CREAR
		var fechaPago = nlapiGetFieldValue('trandate');
		var fechaInicioRetencion = '01/02/2015';
		//alert(fechaPago+' :::: '+ nlapiStringToDate(fechaInicioRetencion, 'date') +' :::: '+ nlapiStringToDate(fechaPago, 'date') +' :::: '+ (nlapiStringToDate(fechaInicioRetencion, 'date') > nlapiStringToDate(fechaPago, 'date')));
		if(nlapiStringToDate(fechaInicioRetencion, 'date') > nlapiStringToDate(fechaPago, 'date')){
			//VALIDANDO QUE ENTRE EN VIGENCIA LA RETENCION
			return true;
		}
		
		var proveedor = nlapiGetFieldValue('entity');
		var datosproveedor = nlapiLookupField('vendor', proveedor, [ 'custentity_lmry_es_agente_retencion', 'custentity_lmry_es_buen_contribuyente', 'custentity_lmry_es_agente_percepcion', 'country' ] );
		if(datosproveedor==null){
			//VALIDA QUE NO SEA PROVEEDOR
			return true;
		}
		var esAgenteRetencion 	= datosproveedor.custentity_lmry_es_agente_retencion;
		var esBuenContribuyente = datosproveedor.custentity_lmry_es_buen_contribuyente;
		var esAgentePercepcion 	= datosproveedor.custentity_lmry_es_agente_percepcion;
		var countryVendor		= datosproveedor.country;

		var tipoCambio = nlapiGetFieldValue('exchangerate');
		var montoTotal = parseFloat(nlapiGetFieldValue('total'))*parseFloat(tipoCambio);
		
		//alert(esAgenteRetencion + '-' + esBuenContribuyente + '-' + montoTotal)
		if(esAgenteRetencion!=1 && esAgentePercepcion!=1 && esBuenContribuyente!=1 && montoTotal > 700 && (countryVendor=='PE'||countryVendor==''||countryVendor==null)){
			//QUITANDO VALORES DE RETENCION A LAS TRANSACCIONES APLICADAS
			buscaImpuestos();
			var cantAplic = nlapiGetLineItemCount('apply');
			var cantAplicadosPago = 0;
			//VALIDANDO CANTIDAD DE TRANSACCIONES A CANCELAR
			for(var cuentaAplicados=1; cuentaAplicados<=cantAplic; cuentaAplicados++){
				//nlapiLogExecution('ERROR', 'INGRESA LINEA EN EL PAGO', 'INGRESA LINEA EN EL PAGO');
				if(nlapiGetLineItemValue('apply', 'apply', cuentaAplicados)=='T'){
					cantAplicadosPago++;
				}
			}
			//CREANDO VARIABLE QUE INDICA EXISTENCIA DE DETRACCION EN UNA FACTURA
			var tieneDetraccion = false;
			//VALIDACION DE QUE LA FACTURA CUENTA CON DETRACCION
			
			for(var cuentaDocAplicado=1; cuentaDocAplicado<=cantAplic; cuentaDocAplicado++){
				//var sumaRetencion = 0;
				//nlapiLogExecution('ERROR', 'INGRESA LINEA EN EL PAGO', 'INGRESA LINEA EN EL PAGO');
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
					if(tieneDetraccion){
						nlapiSetFieldValue('custbody_lmry_serie_retencion','');
					}
					var valorFecha = recSOx.getFieldValue('trandate');
						validaFecha(valorFecha);
					var cantItemx = recSOx.getLineItemCount('item');
					var cantExpnx = recSOx.getLineItemCount('expense');
					
					if(recSOx.getFieldValue('custbody_lmry_concepto_detraccion')!=12){
						//FACTURA TIENE CONCEPTO DE DETRACCION DISTINTO A 'SIN DETRACCION'
						tieneDetraccion = true;
						nlapiSetFieldValue('custbody_lmry_serie_retencion','');
						alert('No se puede realizar pago de facturas con Retencion y Detraccion al mismo tiempo. Verifique la columna de Concepto de Detraccion.');
								return false;
					}else{
						if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){
							if(tieneDetraccion){
								//alert('Este pago cuenta con facturas con detraccion y con retencion. Debe quitar la aplicacion a la factura '+recSOx.getFieldValue('tranid') + ' para realizar el pago con detraccion.');
								alert('No se puede realizar pago de facturas con Retencion y Detraccion al mismo tiempo. Verifique la columna de Concepto de Detraccion.');
								return false;
							}
							//VALIDANDO CANTIDAD DE FACTURAS APLICADAS
							if(cantAplicadosPago>12){
								//alert('Este pago es afecto a retencion. Debe seleccionar como mÃ¡ximo 12 facturas en este pago.');
								alert('Solo pague hasta 12 Documentos');
								return false;
							}
							//VALIDANDO QUE DEBE ELEGIR SERIE DE RETENCION
							if( nlapiGetFieldValue('custbody_lmry_serie_retencion')==null || nlapiGetFieldValue('custbody_lmry_serie_retencion')=='' ){
								//alert('Este pago es afecto a retencion. Debe seleccionar la serie de retencion.');
								alert('Seleccione la serie de retencion.');							
								return false;
							}
							//VALIDANDO QUE LA FACTURA ESTA AFECTA A IGV
							if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){
								for(var a=1; a<=cantItemx; a++){
									recSOx.setLineItemValue('item','custcol_4601_witaxapplies',a,'T');
									recSOx.setLineItemValue('item','custcol_4601_witaxcode',a,WTHolding);///
									recSOx.setLineItemValue('item','custcol_4601_witaxrate',a,valorporc);
									recSOx.setLineItemValue('item','custcol_4601_witaxbaseamount',a, recSOx.getLineItemValue('item','grossamt',a));
									recSOx.setLineItemValue('item','custcol_4601_witaxamount',a,(valorporc*parseFloat(recSOx.getLineItemValue('item','grossamt',a))/100));
								}
								for(var b=1; b<=cantExpnx; b++){
									recSOx.setLineItemValue('expense','custcol_4601_witaxapplies',b,'T');
									recSOx.setLineItemValue('expense','custcol_4601_witaxcode',b,WTHolding);///
									recSOx.setLineItemValue('expense','custcol_4601_witaxrate',b,valorporc);
									recSOx.setLineItemValue('expense','custcol_4601_witaxbaseamount',b, recSOx.getLineItemValue('expense','grossamt',b));
									recSOx.setLineItemValue('expense','custcol_4601_witaxamount',b,(valorporc*parseFloat(recSOx.getLineItemValue('expense','grossamt',b))/100));
								}
								nlapiSubmitRecord(recSOx, false, true);
							}
						}			
					}
				}
			}
		}
    }else{
		//VALIDACION SOLO PARA FACTURAS POR EDITAR/ELIMINAR
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_pago_relacionado', null, 'anyof', nlapiGetRecordId());
		var transacdata = nlapiSearchRecord('customrecord_lmry_comprobante_retencion', null, filters, columns);
		var longitud = 0;
		if(transacdata!=null){
			longitud = transacdata.length;
		}
		if(longitud>0){
			alert('No se puede Editar el Pago. Eliminelo y vuelva a generar la transaccion.');
			return false;
		}
	}
	return true;
}

/*
//var validaAgente = nlapiLookupField('subsidiary',nlapiGetFieldValue('subsidiary'),'custrecordagente_de_retencion');
var fechaPago = nlapiGetFieldValue('trandate');
//if(validaAgente=='T'){
	//VALIDA QUE ENCUENTRE LA TRANSACCION CORRECTA
	var encontroTransaccion = false;
	
	//VALIDA SERIE Y NUMERO DE COMPROBANTE DE RETENCION DE DARSE EL CASO
	var IDSerie = nlapiGetFieldValue('custbody_ns_serie_impresion_retenc');
	if(IDSerie!=null && IDSerie!=''){
		var filtersRetencion = new Array();
		filtersRetencion[0] = new nlobjSearchFilter('mainline', null, 'is', 'T');
		filtersRetencion[1] = new nlobjSearchFilter('custbody_ns_serie_impresion_retenc', null, 'is', IDSerie);
		filtersRetencion[2] = new nlobjSearchFilter('custbody_ns_nro_comp_retenc', null, 'is', nlapiGetFieldValue('custbody_ns_nro_comp_retenc'));
						
		var transacdata = nlapiSearchRecord('vendorpayment', null, filtersRetencion, null);
		if(transacdata!=null){
			return alert('Serie y Numero de Comprobante Retencion han sido registrados durante otra transaccion. \n Ingresar otro Numero de Comprobante.');
		}
	}
	
	var entidad = nlapiGetFieldValue('entity');
	
	//AQUI TRAE EL CODIGO POR DEFECTO DEL CODIGO RETENCION POR PROVEEDOR
	var codeWHT = nlapiLookupField('vendor',entidad,'custentity_4601_defaultwitaxcode');
	
	//DATOS DEL PROVEEDOR
	var esAgenteRetencion = nlapiLookupField('vendor',entidad,'custentity_agente_retencion');
	var esBuenContribuyente = nlapiLookupField('vendor',entidad,'custentity_buen_contribuyente');
	var montoDetraccion = nlapiGetFieldValue('custbody_monto_detraccion');
	
	var montoTotal = nlapiGetFieldValue('total');	
	var tipoCambio = nlapiGetFieldValue('exchangerate');
	montoTotal = parseFloat(montoTotal)*parseFloat(tipoCambio);	
	
	//SI LOS DATOS DE PROVEEDOR SON CORRECTOS PARA HACER LA RETENCION
	alert((montoTotal > 700)  + (esAgenteRetencion !='T') + (esBuenContribuyente !='T') + (!(montoDetraccion>0 && codeWHT!=null && codeWHT!='')));
	if(montoTotal > 700  && esAgenteRetencion !='T' && esBuenContribuyente !='T' && !(montoDetraccion>0 && codeWHT!=null && codeWHT!='')){
		//W.CARPIO. DEJARE EL VALOR DEL PORCENTAJE DE RETENCION EN 6% HASTA DEFINIR LA DIFERENCIACION EN LA LISTA DE CODIGOS DE RETENCION
		var filtrosImpuestos = new Array();
		filtrosImpuestos[0] = new nlobjSearchFilter('custrecord_4601_wtc_description', null, 'contains', 'Retencion del IGV');
		var columnasImpuestos = new Array();
		columnasImpuestos[0] = new nlobjSearchColumn('custrecord_4601_wtc_effectivefrom');
		columnasImpuestos[1] = new nlobjSearchColumn('custrecord_4601_wtc_rate');
		columnasImpuestos[2] = new nlobjSearchColumn('internalid');
		
		var valorporc = null;
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
		
		//alert('Datos Antes: '+valorporcA+WTHoldingA+'; Datos Despues: '+valorporcB+WTHoldingB);
		
		// VERIFICA SI FORMULARIO APLICA RETENCION
		if(nlapiGetFieldValue('custbody_ns_no_aplica_retenc')!='T'){
			var cantAplic = nlapiGetLineItemCount('apply');
			var cambiaSerie =  false;
			
			var tieneDetraccion = false;
			
			for(var xx=1; xx<=cantAplic; xx++){
			//alert(nlapiGetLineItemValue('apply','apply',xx));
				if(nlapiGetLineItemValue('apply','apply',xx)=='T'){
					var vendorBillIdx = nlapiGetLineItemValue('apply','internalid',xx);
					//CARGAMOS LOS DATOS DE LA TRANSACCION

					if(nlapiLookupField('vendorbill',vendorBillIdx,'entity')!=null || nlapiLookupField('vendorbill',vendorBillIdx,'account')!=null){
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
				//}MODIFICADO 14/01/2013
					//alert('1 '+recSOx);
					var cantItemx = recSOx.getLineItemCount('item');
					var cantExpnx = recSOx.getLineItemCount('expense');
					
					for(var ax=1; ax<=cantItemx; ax++){
						var reteA = recSOx.getLineItemValue('item','custcol_4601_witaxcode',ax,WTHolding);
						if(reteA==11||reteA==10||reteA==16||reteA==17||reteA==18||reteA==228){
							tieneDetraccion=true;
						}
					}
					//MODIFICA LOS GASTOS DE LA FACTURA
					for(var bx=1; bx<=cantExpnx; bx++){
						var reteB = recSOx.getLineItemValue('expense','custcol_4601_witaxcode',bx,WTHolding);
						if(reteB==11||reteB==10||reteB==16||reteB==17||reteB==18||reteB==228){
							tieneDetraccion=true;
						}
					}
				}
			}
							
			for(var x=1; x<=cantAplic; x++){
				if(nlapiGetLineItemValue('apply','apply',x)=='T'){
					var vendorBillId = nlapiGetLineItemValue('apply','internalid',x);
					//CARGAMOS LOS DATOS DE LA TRANSACCION
					if(nlapiLookupField('vendorbill',vendorBillId,'entity')!=null){
						var recSO = nlapiLoadRecord('vendorbill',vendorBillId);
						encontroTransaccion = true;
					}else{
						if(nlapiLookupField('vendorcredit',vendorBillId,'entity')!=null){
							var recSO = nlapiLoadRecord('vendorcredit',vendorBillId);
							encontroTransaccion = true;
						}else{
							if(nlapiLookupField('expensereport',vendorBillId,'entity')!=null){
								var recSO = nlapiLoadRecord('expensereport',vendorBillId);
								encontroTransaccion = true;
							}else{
								encontroTransaccion = false;
							}
						}
					}
					
					if(encontroTransaccion && !tieneDetraccion){
						//VALIDACION DE QUE TIPO DOCUMENTO ES AFECTO A RETENCION
						var tipoDocumento = recSO.getFieldValue('custbody_tipo_doc_cxp');
						  
						if(nlapiStringToDate(recSO.getFieldValue('trandate'), 'date') < nlapiStringToDate(fechaObtenida, 'date')){
							valorporc = valorporcA+'';
							valorporc = valorporc.split('%')[0];
							WTHolding = WTHoldingA;
						}else{
							valorporc = valorporcB;
							valorporc = valorporc.split('%')[0];
							WTHolding = WTHoldingB;
						}
						var afectoRetencion = nlapiLookupField('customrecord_tipo_doc_cxc', tipoDocumento,'custrecord_ns_afecto_retencion'); 
						//alert('2 '+recSO);
						var cantItem = recSO.getLineItemCount('item');
						var cantExpn = recSO.getLineItemCount('expense');
						var montoDetraccionxDoc = recSO.getFieldValue('custbody_monto_detraccion');
						//VALIDA SI EXISTE MONTO DETRACCION O SI EL DOCUMENTO ES NO AFECTO A RETENCION
						if(!(montoDetraccionxDoc>0) && afectoRetencion=='T'){
							//Valida Serie y Nro RetenciÃƒÆ’Ã‚Â³n
							var serieRete = nlapiGetFieldValue('custbody_ns_serie_impresion_retenc');
							if(serieRete == null || serieRete == ''){
								return alert('Se debe ingresar Serie y Numero de Retencion');
							}
							//MODIFICA LOS ARTICULOS DE LA FACTURA
							for(var a=1; a<=cantItem; a++){
								recSO.setLineItemValue('item','custcol_4601_witaxapplies',a,'T');
								recSO.setLineItemValue('item','custcol_4601_witaxcode',a,WTHolding);
								recSO.setLineItemValue('item','custcol_4601_witaxrate',a,valorporc);
								recSO.setLineItemValue('item','custcol_4601_witaxbaseamount',a, recSO.getLineItemValue('item','grossamt',a));
								recSO.setLineItemValue('item','custcol_4601_witaxamount',a,(valorporc*parseFloat(recSO.getLineItemValue('item','grossamt',a))/100));
							}
							//MODIFICA LOS GASTOS DE LA FACTURA
							for(var b=1; b<=cantExpn; b++){
								recSO.setLineItemValue('expense','custcol_4601_witaxapplies',b,'T');
								recSO.setLineItemValue('expense','custcol_4601_witaxcode',b,WTHolding);///
								recSO.setLineItemValue('expense','custcol_4601_witaxrate',b,valorporc);
								recSO.setLineItemValue('expense','custcol_4601_witaxbaseamount',b,recSO.getLineItemValue('expense','grossamt',b));
								recSO.setLineItemValue('expense','custcol_4601_witaxamount',b,(valorporc*parseFloat(recSO.getLineItemValue('expense','grossamt',b))/100));////
							}
							cambiaSerie = true;
						}
						//recSO.setFieldValue('custpage_4601_witaxamount', valorporc*parseFloat(recSO.getFieldValue('custpage_4601_witaxbaseamount')));
						nlapiSubmitRecord(recSO, true); // submit the record
					}
				}
			}
			if(cambiaSerie){
				//REALIZA LA MODIFICACION DEL CORRELATIVO PARA COMPROBANTES DE RETENCION
				var IDSerie = nlapiGetFieldValue('custbody_ns_serie_impresion_retenc');
				if(IDSerie==null || IDSerie==''){
					return alert('Debe ingresar los valores de Serie y NÃƒÆ’Ã‚Âºmero de Comprobante RetenciÃƒÆ’Ã‚Â³n');
				}
				var filtersRetencion = new Array();
				filtersRetencion[0] = new nlobjSearchFilter('mainline', null, 'is', 'T');
				filtersRetencion[1] = new nlobjSearchFilter('custbody_ns_serie_impresion_retenc', null, 'is', IDSerie);
				filtersRetencion[2] = new nlobjSearchFilter('custbody_ns_nro_comp_retenc', null, 'is', nlapiGetFieldValue('custbody_ns_nro_comp_retenc'));
						
				var transacdata = nlapiSearchRecord('vendorpayment', null, filtersRetencion, null);
				if(transacdata!=null){
					return alert('Serie y Numero de Comprobante Retencion han sido registrados durante otra transaccion. \n Ingresar otro Numero de Comprobante.');
				}
				if(IDSerie!=null || IDSerie!=''){
					var recordSerie = nlapiLoadRecord('customrecord_ns_serie_comp_retenc',IDSerie);
					recordSerie.setFieldValue('custrecord_ns_valor_actual',parseFloat(nlapiGetFieldValue('custbody_ns_nro_comp_retenc')));
					nlapiSubmitRecord(recordSerie, true); // submit the record
				}
			}
		}else{
			var cantAplic = nlapiGetLineItemCount('apply');
			for(var x=1; x<=cantAplic; x++){
				if(nlapiGetLineItemValue('apply','apply',x)=='T'){
					var vendorBillId = nlapiGetLineItemValue('apply','internalid',x);
					if(nlapiLookupField('vendorbill',vendorBillId,'entity')!=null){
						var recSO = nlapiLoadRecord('vendorbill',vendorBillId);
						encontroTransaccion = true;
					}else{
						if(nlapiLookupField('vendorcredit',vendorBillId,'entity')!=null){
							var recSO = nlapiLoadRecord('vendorcredit',vendorBillId);
							encontroTransaccion = true;
						}else{
							if(nlapiLookupField('expensereport',vendorBillId,'entity')!=null){
								var recSO = nlapiLoadRecord('expensereport',vendorBillId);
								encontroTransaccion = true;
							}else{
								encontroTransaccion = false;
							}
						}
					}					
					
					if(encontroTransaccion){
						nlapiSetLineItemValue('apply','amount',nlapiGetLineItemValue('apply','custpage_4601_total',x));
						nlapiSetLineItemValue('apply','custpage_4601_withheld','');
						nlapiSetLineItemValue('apply','custpage_4601_total','');
						
						if(recSO.getFieldValue('custpage_4601_witaxamount')>0 || recSO.getFieldValue('custpage_4601_witaxamount')==null){
							//alert('3 '+recSO);
							var cantItem = recSO.getLineItemCount('item');
							var cantExpn = recSO.getLineItemCount('expense');
							for(var a=1; a<=cantItem; a++){
								recSO.setLineItemValue('item','custcol_4601_witaxapplies',a,'');
								recSO.setLineItemValue('item','custcol_4601_witaxcode',a,'');
								recSO.setLineItemValue('item','custcol_4601_witaxrate',a,'');
								recSO.setLineItemValue('item','custcol_4601_witaxbaseamount',a,'');
								recSO.setLineItemValue('item','custcol_4601_witaxamount',a,'');
								recSO.setLineItemValue('item','custcol_4601_witaxrate_exp',a,'0.0%');
								recSO.setLineItemValue('item','custcol_4601_witaxamt_exp',a,0);
								recSO.setLineItemValue('item','custcol_4601_witaxbamt_exp',a,0);
							}
							for(var b=1; b<=cantExpn; b++){
								recSO.setLineItemValue('expense','custcol_4601_witaxapplies',b,'');
								recSO.setLineItemValue('expense','custcol_4601_witaxcode',b,'');
								recSO.setLineItemValue('expense','custcol_4601_witaxrate',b,'');
								recSO.setLineItemValue('expense','custcol_4601_witaxbaseamount',b,'');
								recSO.setLineItemValue('expense','custcol_4601_witaxamount',b,'');
								recSO.setLineItemValue('expense','custcol_4601_witaxrate_exp',b,'0.0%');
								recSO.setLineItemValue('expense','custcol_4601_witaxamt_exp',b,0);
								recSO.setLineItemValue('expense','custcol_4601_witaxbamt_exp',b,0);
							}
							nlapiSubmitRecord(recSO, true); // submit the record
						}
					}
				}
			}
		}
	}
//}
 */