import types=require("./types")
import metakeys=require("./metaKeys")
const proxyCache=new WeakMap<any,any>();

export function proxy(tv:any,t:types.Type,bnd?:types.IGraphPoint){
    if (typeof tv!="object"){
        return tv;
    }
    if (tv==null||tv==undefined){
        return null;
    }
    if (Proxy){
        if (proxyCache.has(tv)){
            return proxyCache.get(tv);
        }
        const val=new Proxy(tv,{
            get: (target:any, property:string, receiver)=> {
                return types.service.getValue(t,target,property,bnd);
            },
            set: function(target, property:string,value:any, receiver) {
                types.service.setValue(t,target,property,value,bnd);
                return true;
            }
        })
        proxyCache.set(tv,val)
        return val;
    }
    else{
        var rs={};
        types.service.allProperties(t).forEach(x=>{
            rs[x.id]=types.service.getValue(t,tv,x.id,bnd);
        });
        //proxyCache.set(tv,rs)
        return rs;
    }
}
export function calcExpression(c: metakeys.Condition, v: types.IGraphPoint): any {
    try {
        if (typeof c == "string") {
            var vv = c.charAt(0);
            if (vv == '@') {
                var mm = <types.Binding>v;
                return mm.lookupVar(c.substring(1));
            }
            var func = new Function("$value", "$","context", "return " + c);
            const contextProxy=new Proxy(v,{
                get: (target:any, property:string, receiver)=> {
                    return (<types.Binding>v).lookupVar(property);
                },
            })
            return func.apply(proxy(v.get(), v.type(), v), [v, v.root().get(),contextProxy]);
        }
        else {
            if (typeof c=="boolean"){
                return c;
            }
            if (typeof c=="number"){
                return c;
            }
            return c(v);
        }
    } catch (e){
        return e;
    }
}
export function calcCondition(c: metakeys.Condition, v: types.IGraphPoint): boolean {
    var val=calcExpression(c,v);
    if (val){
        return true;
    }
    return false;
}