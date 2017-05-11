/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 oct 2014     LatamReady Consultor
 * File : LMRY_InvoiceURET.js
 */
var LMRY_script = 'LMRY Invoice URET';
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function InvUret_BeforeLoad(type, form, request){
	// Que el evento sea diferente de Print y Email
	if ( type!='print' && type!='email' ) {
		
		// Valida que tenga acceso
		var LMRY_Result = ValidateAccessInv( nlapiGetFieldValue('subsidiary') , type);
		
		// Solo para Mexico
		if ( LMRY_Result[0]=='MX') 
		{
			// Lista de estado de proceso
			var procesado = nlapiGetFieldValue('custbody_lmry_schedule_transfer_of_iva');
			// Verifica si esta procesado y si esta activo el feature de bloqueo de transaccion
			if ( procesado==1 && getAuthorization(97) ) 
			{
				// Elimina el boton de edicion
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
function InvUret_BeforeSubmit(type)
{
	var LMRY_Result = ValidateAccessInv( nlapiGetFieldValue('subsidiary') );

	try {		
		if ( type!='delete' ) {			
			// Para todos los paises que tengan acceso
			if ( LMRY_Result[2]==true && nlapiGetFieldValue('memo')!='VOID' ) 
			{
				// Validamos que no este vacio
				var currency = nlapiGetFieldValue('currency');
				if ( currency=='' || currency==null )
				{
					return true;
				}
				// Buscamos el nombre y simbolo de la moneda
				var monedaTexto = nlapiLookupField('currency', currency, ['name', 'symbol']);
				var mon_name = monedaTexto.name;
				var mon_symb = monedaTexto.symbol;
				
				// Importe total de la transaccion
				var imptotal = nlapiGetFieldValue('total');
				//campos Witholding
				if(LMRY_Result[0]=='PE'){
				// Para las retenciones
					
					var wtax_wamt = 0;
					var wtax_wcod = nlapiGetFieldValue('custpage_4601_witaxcode');	         	
					if (wtax_wcod!=null && wtax_wcod!='') {
		                var wtax_type = nlapiLookupField('customrecord_4601_witaxcode', wtax_wcod, 'custrecord_4601_wtc_witaxtype');	                
		                var wtaxtype_name = nlapiLookupField('customrecord_4601_witaxtype', wtax_type, 'custrecord_4601_wtt_name');
						wtax_wamt = nlapiGetFieldValue('custpage_4601_witaxamount');		              
						var witaxrate	= nlapiGetFieldValue('custpage_4601_witaxrate');		             		           
						nlapiSetFieldValue('custbody_lmry_wtax_amount', wtax_wamt);											
						nlapiSetFieldValue('custbody_lmry_wtax_rate',witaxrate);		             
		              nlapiSetFieldValue('custbody_lmry_wtax_code_des', wtaxtype_name);		
					}
					var autoDetra = nlapiLookupField('customrecord_lmry_pe_fel_enable_feature','1','custrecord_lmry_pe_apli_detra');
					if(autoDetra==null && autoDetra==''){
						nlapiDisableField( 'custbody_lmry_wtax_code_des', true);
						
					}			
				}				
				
				// Convertimos el monto en letras
				var impletras = '';
				switch (LMRY_Result[0]) {
				  case 'PA':
					impletras = ConvNumeroLetraESP(imptotal, '', '', 'Y');
			        break;
				  case 'PY':
					    imptotal = parseFloat(nlapiGetFieldValue('total'));
						impletras = ConvNumeroLetraESP(imptotal,  mon_name, mon_symb, 'Y');
				        break;
				  case 'CO':
					    imptotal = parseFloat(nlapiGetFieldValue('total'));
						impletras = ConvNumeroLetraESP(imptotal,  mon_name, mon_symb, 'Y');
						nlapiSetFieldValue('custbody_lmry_co_monto_letras', impletras);
						
						nlapiLogExecution('ERROR', 'InvUret_BeforeSubmit : custbody_lmry_co_monto_letras  ' + imptotal , impletras);
				        break;
				  default:
					impletras = ConvNumeroLetraESP(imptotal, mon_name, '', 'Y');
			        break;
				}
				if ( LMRY_Result[0]!='CO' && LMRY_Result[0]!='SV')	{
					nlapiSetFieldValue('custbody_monto_letras_pa', impletras);
					
					nlapiLogExecution('ERROR', 'InvUret_BeforeSubmit : custbody_monto_letras_pa  ' + imptotal , impletras);
				}
			}	
		}
	} catch(err) {
		sendemail(' [ InvUret_BeforeSubmit ] ' +err, LMRY_script);		
	} 
	return true;
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
function InvUret_AfterSubmit(type){
	try {
		var LMRY_Intern = nlapiGetRecordId();
		var LMRY_Result = ValidateAccessInv( nlapiGetFieldValue('subsidiary') );

		if ( type=='delete' ) {	
			// Solo para Mexico
			if (LMRY_Result[0]=='MX' && LMRY_Result[2]==true) 
			{
				// Elimina registros
				Delete_JE( LMRY_Intern );
			}	
			
			// Para Colombia, Bolivia y Paraguay - Enabled Feature WHT Latam
			if ( (LMRY_Result[0]=='CO' && getAuthorization(27)==true) ||
				 (LMRY_Result[0]=='BO' && getAuthorization(46)==true) ||
				 (LMRY_Result[0]=='PY' && getAuthorization(47)==true) ) 
			{
				// Elimina registros
				Delete_JE( LMRY_Intern );

				// Delete Credit Memo
				Delete_CM( 'creditmemo', LMRY_Intern );
			}
		}

		if ( (type=='create' || type=='edit') && nlapiGetFieldValue('memo')!='VOID' ) 
		{
			nlapiLogExecution('ERROR', 'InvUret_AfterSubmit - LMRY_Result[0] , Memo ', LMRY_Result[0] + ', ' + nlapiGetFieldValue('memo'));
	
			// Solo para Mexico - Enabled Feature Redireccionamiento de Cuentas
			if (LMRY_Result[0]=='MX' && getAuthorization(22)==true) 
			{
				// Elimina los asientos
				Delete_JE( nlapiGetRecordId() );
				
				// Realiza la redireccion de cuentas 
				Create_Redirect_Inv( nlapiGetRecordId() );
			}
			
			// Para Colombia, Bolivia y Ecuador - Enabled Feature WHT Latam
			if ( (LMRY_Result[0]=='CO' && getAuthorization(27)==true) ||
				 (LMRY_Result[0]=='BO' && getAuthorization(46)==true) ||
				 (LMRY_Result[0]=='EC' && getAuthorization(41)==true) )
			{
				// Realiza la redireccion de cuentas 
				Create_WHT_Latam( 'invoice', nlapiGetRecordId() );
			}
			
			// Para Paraguay - Enabled Feature WHT Latam
			if ( (LMRY_Result[0]=='PY' && getAuthorization(47)==true) )
			{
				// Realiza la redireccion de cuentas 
				PY_Tax_Group( nlapiGetRecordId() );
			}

		}		
	} catch(err){
		sendemail(' [ InvUret_AfterSubmit ] ' + err, LMRY_script);
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * Procesa las lineas de la transaccion para extraer
 * los impuestos a un registro personalizado 
 * --------------------------------------------------------------------------------------------------- */
function PY_Tax_Group( inv_internalid )
{
	try {
		// valida que exista internalid
		if ( inv_internalid=='' || inv_internalid==null ) { return true; }
		
		//Variable global LATAM - VERSION BETA
		var VerBeta = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_version_beta');	
		if ( VerBeta=='F') { return true; }
		
		// Carga la factura
		var record = nlapiLoadRecord('invoice', inv_internalid);
		
		// Totales de Tax en cabecera
		var h_taxiva = 0;
		var h_taxret = 0;
		var h_taxest = 0;
		
		// Se suma los mismos codigos de impuesto
		var recQY = record.getLineItemCount('item');
		for (var pos=1; pos<=recQY; pos++) 
		{
			var linnro = record.getLineItemValue('item', 'line'   , pos);  // taxcode
			var linitm = record.getLineItemValue('item', 'item'   , pos);  // item
			var lintax = record.getLineItemValue('item', 'taxcode', pos);  // taxcode
			var linamo = record.getLineItemValue('item', 'amount' , pos);  // amount
			var linrte = record.getLineItemValue('item', 'tax1amt', pos);  // taxamount
		
			//  Filtros del Query
			var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_lmry_tax_name', null, 'is', lintax);
			var columns = new Array();
				columns[0] = new nlobjSearchColumn('name');	
				columns[1] = new nlobjSearchColumn('custrecord_lmry_tax_iva');	
				columns[2] = new nlobjSearchColumn('custrecord_lmry_tax_rete_ir');	
				columns[3] = new nlobjSearchColumn('custrecord_lmry_tax_rete_estado');	
			var trandata = nlapiSearchRecord('customrecord_lmry_tax_group', null, filters, columns);
			if ( trandata!='' && trandata!=null)
			{
				// Nombre del grupo impuesto
				var tranid = trandata[0].getValue('name');
				// Porcentajes de impuesto
				var taxiva = trandata[0].getValue('custrecord_lmry_tax_iva');
				if ( taxiva=='' || taxiva==null ) { taxiva = 0; }
					taxiva = (linamo * taxiva)/100;
				var taxret = trandata[0].getValue('custrecord_lmry_tax_rete_ir');
				if ( taxret=='' || taxret==null ) { taxret = 0; }
					taxret = (linamo * taxret)/100;
				var taxest = trandata[0].getValue('custrecord_lmry_tax_rete_estado');
				if ( taxest=='' || taxest==null ) { taxest = 0; }
					taxest = (linamo * taxest)/100;
				
				// Graba en el registro personalizado
				var newrecord = nlapiCreateRecord('customrecord_lmry_tax_transactions_line');
					newrecord.setFieldValue('name', tranid);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_referen', inv_internalid);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_line'   , linnro);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_item'   , linitm);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_amount' , linamo);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_iva'    , taxiva);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_reteir' , taxret);
					newrecord.setFieldValue('custrecord_lmry_tax_transactions_reteest', taxest);
				id_record = nlapiSubmitRecord(newrecord);
				
				// Acumula totales
				h_taxiva = parseFloat(h_taxiva) + parseFloat(taxiva); 
				h_taxret = parseFloat(h_taxret) + parseFloat(taxret); 
				h_taxest = parseFloat(h_taxest) + parseFloat(taxest); 
			}
		}
		record = null;

		// Actualiza los campos de cabecera
		nlapiSubmitField('invoice', inv_internalid, 
				['custbody_lmry_py_tax_amount_iva', 'custbody_lmry_py_tax_amount_rete_ir', 'custbody_lmry_py_tax_amount_rete_state'], 
				[h_taxiva, h_taxret, h_taxest]);

	} catch(err){
		sendemail(' [ PY_Tax_Group ] ' + err, LMRY_script);
	}
}

/* ------------------------------------------------------------------------------------------------------
 * A la variable featureId se le asigna el valore que le corresponde 
 * --------------------------------------------------------------------------------------------------- */
function ValidateAccessInv(ID, type) {
var LMRY_access = false;
var LMRY_countr = new Array();
var LMRY_Result = new Array();

	try{
		// Oculta todos los campos LMRY
		onFieldsHide(2);	

		// Inicializa variables Locales y Globales
		LMRY_access = false;
		LMRY_countr = Validate_Country( ID );

		// Verifica que el arreglo este lleno
		if ( LMRY_countr.length<1 ){
			LMRY_Result[2] = LMRY_access;
			return LMRY_Result;
		}
		LMRY_access = getCountryOfAccess(LMRY_countr);

		// Solo si tiene acceso
		if ( LMRY_access==true ) 
		{
			// Activa los campos LatamReady
			onFieldsDisplayBody( LMRY_countr[1], 'custrecord_lmry_on_invoice' );
			
			// Visualiza los campos segun el Parent
			if ( type=='edit' || type=='view' )
			{
				// Solo para subsidiaria el Peru y El Salvador - Transaccion Invoice
				if ( LMRY_countr[0]=='PE' || LMRY_countr[0]=='SV' ) 
				{
					// Tipo de Documento - Parent
					var lmry_DocTip = nlapiGetFieldValue('custbody_lmry_document_type');
					if (lmry_DocTip!='' && lmry_DocTip!=null) 
					{
						// Visualiza campos LMRY
						onFieldsDisplayParent(LMRY_countr[1], lmry_DocTip);
					}					
				}				
			} 
		}
		
		// Asigna Valores
		LMRY_Result[0] = LMRY_countr[0];
		LMRY_Result[1] = LMRY_countr[1];
		LMRY_Result[2] = LMRY_access;
	} catch(err) {
		sendemail(' [ ValidateAccessInv ] ' +err, LMRY_script);
	}

	return LMRY_Result;
}