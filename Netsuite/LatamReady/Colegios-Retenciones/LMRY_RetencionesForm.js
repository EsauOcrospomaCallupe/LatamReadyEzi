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

		var cantAplic = nlapiGetLineItemCount('apply');
		//para los pagos
		var montoTot =0;
		var montoTot2 =0;
		var notieneDetraccion = true;

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
							encontroTransaccion = false;
                          
						}else{
							encontroTransaccion = false;
						}
					}
				}
				if(encontroTransaccion){
					if(recSOx.getFieldValue('custbody_lmry_concepto_detraccion')!=12){
						//FACTURA TIENE CONCEPTO DE DETRACCION DISTINTO A 'SIN DETRACCION'
						notieneDetraccion = false;
                      	
						if(nlapiGetFieldValue('custbody_lmry_serie_retencion')!='' && nlapiGetFieldValue('custbody_lmry_serie_retencion')!=null ){
                         
							alert('No se puede realizar pago de facturas con Retencion y Detraccion al mismo tiempo. Verifique la columna de Concepto de Detraccion.');
							return false;

						}
						//nlapiSetFieldValue('custbody_lmry_serie_retencion','');
								
								
					}
                  
                  var tipoDocumento = recSOx.getFieldValue('custbody_lmry_document_type');

                  var montofac = parseFloat(recSOx.getFieldValue('usertotal'));
                  if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){

                      montoTot=montoTot+montofac;

                  }

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
						montoTot2= montoTot2+montofac;
					}
				  }	
               }  
			}	
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
		if(notieneDetraccion){


		
		//alert(esAgenteRetencion + '-' + esBuenContribuyente + '-' + montoTotal)
		if((montoTot>700 && montoTot2>700) && esAgenteRetencion!=1 && esAgentePercepcion!=1 && esBuenContribuyente!=1  && (countryVendor=='PE'||countryVendor==''||countryVendor==null)){
			//QUITANDO VALORES DE RETENCION A LAS TRANSACCIONES APLICADAS
			buscaImpuestos();
			
			var cantAplicadosPago = 0;
			//VALIDANDO CANTIDAD DE TRANSACCIONES A CANCELAR
			for(var cuentaAplicados=1; cuentaAplicados<=cantAplic; cuentaAplicados++){
				//nlapiLogExecution('ERROR', 'INGRESA LINEA EN EL PAGO', 'INGRESA LINEA EN EL PAGO');
				if(nlapiGetLineItemValue('apply', 'apply', cuentaAplicados)=='T'){
					cantAplicadosPago++;
				}
			}
			//CREANDO VARIABLE QUE INDICA EXISTENCIA DE DETRACCION EN UNA FACTURA
			
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
								encontroTransaccion = false;
							}else{
								encontroTransaccion = false;
							}
						}
					}
					
					var valorFecha = recSOx.getFieldValue('trandate');
						validaFecha(valorFecha);
					var cantItemx = recSOx.getLineItemCount('item');
					var cantExpnx = recSOx.getLineItemCount('expense');
					var tipoDocumento = recSOx.getFieldValue('custbody_lmry_document_type');
					var valorRetenido = 0;
					var montofactura = parseFloat(recSOx.getFieldValue('usertotal'));

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
					//nlapiLogExecution('ERROR', 'exitoRetencion',exitoRe);
					//nlapiLogExecution('ERROR', 'montofactura',montofactura);
					//valida si el tipo de documento esta dentro de la tabla "LatamReady - Pe Retenciones :)"
					if(exitoRe){
						
						if(montofactura>700 || (montoTotal>700 && montofactura<700)){
							//nlapiLogExecution('ERROR', 'exitoRetencion','entro');
							
							

								if(parseFloat(recSOx.getFieldValue('taxtotal'))>0){
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
