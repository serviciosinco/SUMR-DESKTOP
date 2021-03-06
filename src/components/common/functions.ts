import electron from 'electron';
import { BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import LocalSCut from 'electron-localshortcut';

import GetGlobal from './globals';
import { DataSet, DataGet } from './store';
import { setBar } from './menu';


type tpObject = {
    [key: string]: string|number|boolean|object
}

const session = { subdomain:'' };

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;

export var MWin_Prev:any;
export var MWin_App:any;

var Mwin_App_Fail:boolean = false;
var MWin_Prev_Fail:boolean = false;
var Mwin_App_Try_Max:number = 0;
var Mwin_App_Try:number = 0;

const isDev_f = ()=>{
	return isDev;
}

if(isDev_f()){
	var log = require('electron-log');
	Mwin_App_Try_Max = 2;
}else{
	var log = null;
	Mwin_App_Try_Max = 5;
}


const isOnline = ()=>{
	
	if(MWin_App){
		var _o = MWin_App.webContents.send('_r_onl');
	}
	
	if(_o != false){
		return true;
	}else{
		return false;
	}		
	
}


export const isMac = ()=>{
	if(process.platform == 'darwin'){ return true; }else{ return false; }
}

export const createWindow_opt = (prev:boolean = false)=>{

	let data:tpObject = { 
		title:'SUMR',
		width:400, 
		height:500,
		frame: ( !isMac() && !prev ) ? true : false,
		show: prev ? true : false,
		titleBarStyle:'hidden',
		backgroundColor: '#23243D',
		webPreferences: {
			contextIsolation: false,
			partition: "persist:main",
			nodeIntegration: true
		}
	};
	
	return data;

}


export const ShortCuts = ()=>{

	LocalSCut.register(MWin_App, 'Ctrl+0', () => {
		
		if(DataGet('menu_dvlp')=='ok'){
            DataSet('menu_dvlp', null); 
        }else{
        	DataSet('menu_dvlp', 'ok'); 
        }
		                
		setBar();
		
    });	

}

export const createWindow = (p:tpObject={})=>{	
	
	session.subdomain = DataGet('subdomain') ? DataGet('subdomain') : '';
	
	var _mreg = '', _url='', __op_prev = createWindow_opt(true), __op = createWindow_opt();

	if(DataGet('menu_dvlp_sv')=='ok'){ _mreg=_mreg+'&Sv=ok'; }
	
	if(!isN(session.subdomain) || (!isN(p) && !isN(p.main) && p.main == 'ok')){
		DataSet('menu_main_clients', 'ok');
		_url = 'https://'+session.subdomain+'.'+GetDomain()+'/?_dsktp=ok&__r='+Math.random()+_mreg;
	}else{
		DataSet('menu_main_clients', 'no');
		_url = GoToAccounts();
	}
	
	MWin_App = new BrowserWindow(__op);
	MWin_Prev = new BrowserWindow(__op_prev);

	//MWin_Prev.loadFile('index.html');
	MWin_Prev.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	MWin_App.setTitle('SUMR');
	LoadContent({ u:_url });
	MWin_App.setMinimumSize(400, 500);

	if(!isMac()){
		MWin_App.setAutoHideMenuBar(true);
	}
  
	MWin_App.on('closed', function(e:any){
		e.preventDefault();
        MWin_App = null;
	});
	
	MWin_Prev.on('closed', function(e:any){
		e.preventDefault();
        MWin_Prev = null;
    });

	MWin_App.on('resize', () => {
		let size = MWin_App.getSize();	
		DataSet('width', size[0]);
		DataSet('height', size[1]);
		DataSet('maximized', MWin_App.isMaximized());
	});

}

export const PreloadClose = ()=>{
	if(MWin_Prev){
		MWin_Prev.close();
	}
}

export const LoadContent = (p:{ u:string })=>{
	
	if(!isN(p) && !isN(p.u) && isOnline()){
		
		var MWin_App_C = MWin_App.webContents,
			MWin_Prev_C = MWin_Prev.webContents,
			_lurl = encodeURI( p.u );
	    
		MWin_App_C.on('did-finish-load', ()=>{

	        LogShow('did-finish-load:'+p.u);
			DataSet('url_last', p.u);

			console.log(Mwin_App_Fail);
			console.log(Mwin_App_Try);

			if(!Mwin_App_Fail){

				RszeOn({ start:true, prev:true }); 

				setTimeout(()=>{
					PreloadClose();
					MWin_App.show();
				}, 100);
				
			}else{

				Mwin_App_Try++;
				Mwin_App_Fail = false;

				if(Mwin_App_Try < Mwin_App_Try_Max){
					setTimeout(()=>{
						MWin_App.loadURL(_lurl);
					}, 20000);
				}else{

					Mwin_App_Try=0;
					let code = `let body = document.body;
								body.classList.add('retry');`;
					
					MWin_Prev.webContents.executeJavaScript(code);

				}

			}

		}); 

		MWin_App_C.on('did-fail-load', (e:object, errorCode:number|string)=>{
			Mwin_App_Fail = true;
		});

		MWin_Prev_C.on('did-fail-load', (e:object, errorCode:number|string)=>{
			MWin_Prev_Fail = true;
			PreloadClose();
		});

		MWin_App.loadURL(_lurl);
		//MWin_App.show();
	
	}else{
		
		LogShow('No u var or not online');
		
	}
}

export const Refresh = (p:tpObject={})=>{
	
	if(!isN(p) && !isN(p.dvlp)){
		
		var _mreg = '';
		var url:string = DataGet('url_last');
		
		if(DataGet('menu_dvlp_sv')=='ok'){
			_mreg=_mreg+'&Sv=ok'; 
		}else{
			var url = url.replace('&Sv=ok', '');
		}
		
		
		if(DataGet('menu_dvlp_test') == 'ok'){
			var url_f = url.replace( GetGlobal('domain_production'), GetGlobal('domain_tester'));
		}else{
			var url_f = url.replace( GetGlobal('domain_tester'), GetGlobal('domain_production') );
		}
		
		LoadContent({ u:url_f+_mreg });
			
	}else{
		
		MWin_App.reload();
		
	}
}
	
export const ClearCache = ()=>{
	/*event.sender.send('tray-removed')*/	
	
	var ses = MWin_App.webContents.session;
	var vln = ses.getCacheSize(function(n:string|number){
		var cCheSze = n;
	});

	
	ses.clearCache(function(){
		Refresh();	
	});		
}

export const isN = (p:any)=>{ 
	try{
		if(p==undefined || p==null || p==''){ return true;}else{return false;} 
	}catch(err) {
		console.log(err.message);
	}
}

export const gotoAcc = (p:tpObject)=>{
	
	if(!isN(p)){		
		
		const ses = MWin_App.webContents.session;
		var _mreg:string = '' ;

		console.log(ses.getUserAgent());
		
		_mreg=_mreg+'&_dsktp=ok';
		
		DataSet('menu_main_clients', 'ok');
		if(DataGet('menu_dvlp_sv')=='ok'){ _mreg=_mreg+'&Sv=ok'; }
		
		LoadContent({ u:p.url+'?__r='+Math.random()+_mreg });
		
	}
}


export const RszeOn = (p:tpObject)=>{

	var _w:number = DataGet('width'),
		_h:number = DataGet('height'),
		_mx:boolean = DataGet('maximized'),
		_win:any = p.prev ? MWin_App:MWin_Prev;

	if(p && p.start){
		if(process.platform == 'darwin'){
			_h=800;
			_w=1200;
		}else{
			_h=500;
			_w=800;
		}
	}
	
	if(_w && _h){
		_win.setSize(_w, _h);
	}else{
		/*_win.maximize();*/	
	}
	
	if(_mx){
		_win.maximize();
	}
	
	if(!isN(p) && !isN(p.minH) && !isN(p.minW)){
		
		if(isN(_w) && isN(_h)){
			_win.setSize(p.minW, p.minH);
		}
		
		_win.setMinimumSize(p.minW, p.minH);
	}
	
	_win.center();
	_win.focus();

}

const GetDomain = ()=>{

	var dmn = '';

	if(DataGet('menu_dvlp_test')=='ok'){
		dmn = GetGlobal('domain_tester');
	}else{
		dmn = GetGlobal('domain_production');
	}	
	
	return dmn;
}

export const GoToAccounts = ()=>{
	let _u = 'https://account.'+GetDomain()+'/?_dsktp=ok&__r='+Math.random();
	return _u;	
}

export const LogShow = ( t: string | object )=>{
	if(isDev_f() && !isN(log)){
		log.info(t);
	}
}