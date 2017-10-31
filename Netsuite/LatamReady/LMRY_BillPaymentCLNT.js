/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 nov 2014     LatamReady Consultor
 * File : LMRY_BillPaymentCLNT.js
 */
//Declaracion de Variables
var objContext = nlapiGetContext(); 
var LMRY_script = 'LMRY Bill Payment CLNT';
var valorporcA = 0;
var WTHoldingA = 0;
var valorporcB = 0;
var WTHoldingB = 0;
var auxiliarTieneDosTasas ='';
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function VPClnt_PageInit(type){
	// Valida el Acceso
	ValidAccessVP( nlapiGetFieldValue('subsidiary') );
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function VPClnt_SaveRecord() {
	try { 
		// Valida el Acceso
		ValidAccessVP( nlapiGetFieldValue('subsidiary') );

		nlapiLogExecution('ERROR', 'autorizacion',getAuthorization(08));

		if (LMRY_countr[0]=='PE' && LMRY_access==true && getAuthorization(08)==true) {
			
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
				nlapiLogExecution('ERROR', 'montoTotal',montoTotal);
				
				//alert(esAgenteRetencion + '-' + esBuenContribuyente + '-' + montoTotal)
				if(esAgenteRetencion!=1 && esAgentePercepcion!=1 && esBuenContribuyente!=1 && (countryVendor=='PE'||countryVendor==''||countryVendor==null)){
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
					/*if(parseFloat(nlapiGetFieldValue('custpage_4601_withheld'))>0){
						tieneDetraccion = true;
						nlapiSetFieldValue('custbody_lmry_serie_retencion','');
					}*/
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
							nlapiLogExecution('ERROR', 'exitoRetencion',exitoRe);
							nlapiLogExecution('ERROR', 'montofactura',montofactura);
							//valida si el tipo de documento esta dentro de la tabla "LatamReady - Pe Retenciones :)"
							if(exitoRe){
								
								if(montofactura>700 || (montoTotal>700 && montofactura<700)){
									nlapiLogExecution('ERROR', 'exitoRetencion','entro');
									if(recSOx.getFieldValue('custbody_lmry_concepto_detraccion')!=12){
										//FACTURA TIENE CONCEPTO DE DETRACCION DISTINTO A 'SIN DETRACCION'
										tieneDetraccion = true;
										nlapiSetFieldValue('custbody_lmry_serie_retencion','');
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
		}

	} catch(err) {
		sendemail(err, LMRY_script);		
	}
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function VPClnt_ValidateField(type, name, linenum){
	if (name=='subsidiary') {
		// Valida el Acceso
		ValidAccessVP( nlapiGetFieldValue('subsidiary') );
	}  
   
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function VPClnt_FieldChanged(type, name, linenum){

}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function VPClnt_PostSourcing(type, name) {
   
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function VPClnt_LineInit(type) {
     
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function VPClnt_ValidateLine(type){
 
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function VPClnt_Recalc(type){
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item insert, false to abort insert
 */
function VPClnt_ValidateInsert(type){
  
    return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 */
function VPClnt_ValidateDelete(type){
   
    return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Localizacion Peruana 
 * --------------------------------------------------------------------------------------------------- */
function buscaImpuestos(){
	// Inicializa Variable
	valorporcA = 0;
	WTHoldingA = 0;
	valorporcB = 0;
	WTHoldingB = 0;


	// Realiza busqueda
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
	}else{
		valorporc = valorporcB;
		valorporc = valorporc.split('%')[0];
		WTHolding = WTHoldingB;
		auxiliarTieneDosTasas = auxiliarTieneDosTasas.substring(0, 1)+'1';
	}
}

/* ------------------------------------------------------------------------------------------------------
 * A la variable featureId se le asigna el valore que le corresponde 
 * --------------------------------------------------------------------------------------------------- */
function ValidAccessVP(ID) {
	try{
		// Oculta todos los campos de cabecera Latam
		onFieldsHide(2);

		// Inicializa variables Locales y Globales
		LMRY_access = false;
		LMRY_countr = Get_Country_STLT(ID);

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
			if ( LMRY_countr[0]=='PE' ) {
				// Suitelet
				var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_agente_reten_stlt', 'customdeploy_lmry_get_agente_reten_stlt') 
				  + '&idSubsidiaria=' + ID;
				var get = nlapiRequestURL(url);
				var EsAgente = get.getBody();
				
				if (EsAgente=='F' || EsAgente=='f') {
					// Oculta el campo
					nlapiSetFieldDisplay('custbody_lmry_serie_retencion', false );
				}
			} 
		}
	} catch(err){
		sendemail(' [ ValidAccessVP ] ' +err, LMRY_script);
	}

	return true;
}