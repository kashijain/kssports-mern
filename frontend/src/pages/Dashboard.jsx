import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, CheckCircle2, Clock, Edit, FileSpreadsheet, LayoutDashboard, Package, Plus, ReceiptIndianRupee, Search, ShoppingBag, Trash2, Users, XCircle } from 'lucide-react';
import { useAuthStore, useOrderStore, useProductStore } from '../store/useStore';
import { getImageUrl, getPrimaryProductImage } from '../utils/media';
import { formatPrice } from '../utils/price';
import UploadStockSheetSection from '../components/admin/UploadStockSheetSection';
import OfflineSalesSection from '../components/admin/OfflineSalesSection';
import SalesReportSection from '../components/admin/SalesReportSection';

const CATEGORY_OPTIONS=[
  'Bat',
  'Ball',
  'Gloves',
  'Accessories',
  'Sleeves',
  'Shaker',
  'Other'
];
const OTHER_SPECIFICATION_OPTION='Other / Add New Specification';
const DEFAULT_SPECIFICATION_OPTIONS_BY_CATEGORY={
  Bat:['Weight','Height','Length','Willow Type','Grip Type','Bat Size','Blade Thickness','Handle Type',OTHER_SPECIFICATION_OPTION],
  Ball:['Weight','Material','Type','Color','Pack Size','Bounce Type',OTHER_SPECIFICATION_OPTION],
  Gloves:['Size','Material','Hand Type','Padding Type','Color',OTHER_SPECIFICATION_OPTION],
  Accessories:['Size','Color','Material','Quantity',OTHER_SPECIFICATION_OPTION],
  Sleeves:['Size','Color','Fabric','Stretch Type',OTHER_SPECIFICATION_OPTION],
  Shaker:['Capacity','Material','Color','Lid Type',OTHER_SPECIFICATION_OPTION],
  Other:[OTHER_SPECIFICATION_OPTION]
};
const cloneSpecificationOptionsMap=()=>Object.fromEntries(
  Object.entries(DEFAULT_SPECIFICATION_OPTIONS_BY_CATEGORY).map(([category,options])=>[category,[...options]])
);
let nextFormRowId=0;
const createFormRowId=()=>`row-${nextFormRowId++}`;
const getSpecificationOptionsForCategory=(category,specificationOptionsMap)=>(
  specificationOptionsMap[category] || [OTHER_SPECIFICATION_OPTION]
);
const getSpecificationFields=(name='',value='',category='',specificationOptionsMap=DEFAULT_SPECIFICATION_OPTIONS_BY_CATEGORY)=>{
  const normalizedName=String(name||'').trim();
  const options=getSpecificationOptionsForCategory(category,specificationOptionsMap);
  if(!normalizedName) return { id:createFormRowId(), option:'', customName:'', value };
  return options.includes(normalizedName)
    ? { id:createFormRowId(), option:normalizedName, customName:'', value }
    : { id:createFormRowId(), option:OTHER_SPECIFICATION_OPTION, customName:normalizedName, value };
};
const getResolvedSpecificationName=(spec)=>{
  if(spec.option===OTHER_SPECIFICATION_OPTION) return spec.customName.trim();
  return spec.option.trim();
};
const createSpec=()=>({ id:createFormRowId(), option:'', customName:'', value:'' });
const FEATURE_OPTIONS=[
  'Durable Build',
  'Lightweight',
  'Premium Quality',
  'High Performance',
  'Comfortable Grip',
  'Long Lasting',
  'Professional Use',
  'Beginner Friendly',
  'Anti Slip',
  'Sweat Resistant'
];
const OTHER_FEATURE_OPTION='Other / Add New Feature';
const getFeatureFields=(feature='')=>{
  const normalizedFeature=String(feature||'').trim();
  if(!normalizedFeature) return { id:createFormRowId(), option:'', customValue:'' };
  return FEATURE_OPTIONS.includes(normalizedFeature)
    ? { id:createFormRowId(), option:normalizedFeature, customValue:'' }
    : { id:createFormRowId(), option:OTHER_FEATURE_OPTION, customValue:normalizedFeature };
};
const getResolvedFeatureValue=(feature)=>{
  if(feature.option===OTHER_FEATURE_OPTION) return feature.customValue.trim();
  return feature.option.trim();
};
const createFeature=()=>({ id:createFormRowId(), option:'', customValue:'' });
const PRODUCT_NAME_OPTIONS=[
  'KC Bat',
  'Veer Bat',
  'GTC Single Scope Bat',
  'GTC Regular Scope Bat',
  'Sai Bat Legend Edition',
  'KS Bat Special Edition',
  '7T7T Bat',
  'Gloves Premium',
  'Gloves Regular',
  'Cock (10)',
  'Cock (20)',
  'Cock (50)',
  'Sixit Ball',
  'Daynite Box',
  'Wind Ball',
  'Leather Ball Heavy',
  'Leather Ball Medium',
  'Shaker',
  'Bat Mitton',
  'Spin Ball',
  'Moti Coil Grip',
  'Cool Hand Sleeves',
  'Plastic Bat',
  'Tennx Ball',
  'Monster Double Blade',
  'Fibre Bat',
  'Mini Coil Kurdari'
];
const OTHER_PRODUCT_OPTION='Other / Add New Product';
const getProductNameFields=(name='')=>{
  const normalizedName=String(name||'').trim();
  if(!normalizedName) return { productNameOption:'', customProductName:'' };
  return PRODUCT_NAME_OPTIONS.includes(normalizedName)
    ? { productNameOption:normalizedName, customProductName:'' }
    : { productNameOption:OTHER_PRODUCT_OPTION, customProductName:normalizedName };
};
const getResolvedProductName=(form)=>{
  if(form.productNameOption===OTHER_PRODUCT_OPTION) return form.customProductName.trim();
  return form.productNameOption.trim();
};
const emptyForm={name:'',productNameOption:'',customProductName:'',price:'',brand:'',category:'',countInStock:'',description:'',codAvailable:true,features:[createFeature()],specifications:[createSpec()]};

const Dashboard=()=>{
  const navigate=useNavigate();
  const location=useLocation();
  const { id }=useParams();
  const { userInfo,logout }=useAuthStore();
  const { products,product,fetchProducts,fetchProductById,createProduct,updateProduct,deleteProduct }=useProductStore();
  const { orders,fetchMyOrders,fetchAllOrders,deliverOrder,deleteOrder }=useOrderStore();
  const [form,setForm]=useState(emptyForm);
  const [categoryOptions,setCategoryOptions]=useState(CATEGORY_OPTIONS);
  const [productNameOptions,setProductNameOptions]=useState(PRODUCT_NAME_OPTIONS);
  const [featureOptions,setFeatureOptions]=useState(FEATURE_OPTIONS);
  const [specificationOptionsMap,setSpecificationOptionsMap]=useState(cloneSpecificationOptionsMap);
  const [search,setSearch]=useState('');
  const [images,setImages]=useState([]);
  const [saving,setSaving]=useState(false);
  const isSeller=userInfo?.role==='seller';
  const isEdit=Boolean(id);
  const tab=!isSeller
    ?'orders'
    :location.pathname.includes('/upload-stock-sheet')
      ?'upload-stock-sheet'
      :location.pathname.includes('/offline-sales')
        ?'offline-sales'
        :location.pathname.includes('/sales-report')
          ?'sales-report'
        :location.pathname.includes('/orders')
          ?'orders'
          :location.pathname.includes('/edit-product/')
            ?'edit'
            :location.pathname.includes('/add-product')
              ?'form'
              :location.pathname.includes('/manage-products')
                ?'inventory'
                :'overview';

  useEffect(()=>{ if(isSeller){ (tab==='orders'?fetchAllOrders():fetchProducts()).catch(()=>{}); } else { fetchMyOrders().catch(()=>{}); } },[isSeller,tab,fetchAllOrders,fetchMyOrders,fetchProducts]);
  useEffect(()=>{ if(isSeller&&isEdit&&id){ fetchProductById(id).catch(e=>{ toast.error(e.message||'Failed to load product'); navigate('/admin/manage-products',{replace:true});}); } else { setForm(emptyForm);} },[isSeller,isEdit,id,fetchProductById,navigate]);
  useEffect(()=>{
    if(isEdit&&product?._id===id){
      const { productNameOption, customProductName }=getProductNameFields(product.name);
      const nextCategory=product.category||'';
      const nextCategoryOptions=nextCategory&&categoryOptions.includes(nextCategory)?categoryOptions:[...categoryOptions,...(nextCategory?[nextCategory]:[])];
      const nextSpecificationOptionsMap=cloneSpecificationOptionsMap();

      nextCategoryOptions.forEach((category)=>{
        if(!nextSpecificationOptionsMap[category]){
          nextSpecificationOptionsMap[category]=[OTHER_SPECIFICATION_OPTION];
        }
      });

      (product.specifications||[]).forEach((spec)=>{
        const specName=String(spec?.name||'').trim();
        if(!specName||!nextCategory) return;
        if(!nextSpecificationOptionsMap[nextCategory]){
          nextSpecificationOptionsMap[nextCategory]=[OTHER_SPECIFICATION_OPTION];
        }
        if(!nextSpecificationOptionsMap[nextCategory].includes(specName)){
          nextSpecificationOptionsMap[nextCategory]=[
            ...nextSpecificationOptionsMap[nextCategory].filter(option=>option!==OTHER_SPECIFICATION_OPTION),
            specName,
            OTHER_SPECIFICATION_OPTION
          ];
        }
      });

      setCategoryOptions(nextCategoryOptions);
      setSpecificationOptionsMap(nextSpecificationOptionsMap);
      setForm({
        name:product.name||'',
        productNameOption,
        customProductName,
        price:product.price??'',
        brand:product.brand||'',
        category:nextCategory,
        countInStock:product.countInStock??'',
        description:product.description||'',
        codAvailable:product.codAvailable!==false,
        features:product.features?.length?product.features.map(getFeatureFields):[createFeature()],
        specifications:product.specifications?.length
          ? product.specifications.map((spec)=>getSpecificationFields(spec.name,spec.value,nextCategory,nextSpecificationOptionsMap))
          : [createSpec()]
      });
    }
  },[isEdit,product,id,categoryOptions]);

  const filtered=useMemo(()=>products.filter(p=>[p.name,p.brand,p.category].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())),[products,search]);
  const selectedProductOption=form.productNameOption;
  const canManageSelectedProduct=selectedProductOption&&selectedProductOption!==OTHER_PRODUCT_OPTION;
  const currentSpecificationOptions=getSpecificationOptionsForCategory(form.category,specificationOptionsMap);
  if(!userInfo) return null;

  const onLogout=async()=>{ await logout(); navigate('/login',{replace:true}); };
  const onDelete=async(pid)=>{ if(!window.confirm('Delete this product permanently?')) return; try{ await deleteProduct(pid); toast.success('Product deleted'); }catch(e){ toast.error(e.message||'Delete failed'); } };
  const onDeliver=async(oid)=>{ try{ await deliverOrder(oid); toast.success('Order delivered'); }catch(e){ toast.error(e.message||'Update failed'); } };
  const onDeleteOrder=async(oid)=>{ if(!window.confirm('Are you sure you want to delete this order?')) return; try{ await deleteOrder(oid); toast.success('Order deleted'); }catch(e){ toast.error(e.message||'Delete failed'); } };
  const onFiles=(e)=>{ const files=Array.from(e.target.files||[]); if(images.length+files.length>4){ toast.error('Max 4 images'); return; } setImages(prev=>[...prev,...files]); e.target.value=null; };
  const updateFeature=(index,key,value)=>setForm(prev=>({ ...prev, features: prev.features.map((feature,i)=>i===index?{ ...feature, [key]:value }:feature) }));
  const addFeature=()=>setForm(prev=>({ ...prev, features:[...prev.features,createFeature()] }));
  const removeFeature=(index)=>setForm(prev=>({ ...prev, features: prev.features.length===1?[createFeature()]:prev.features.filter((_,i)=>i!==index) }));
  const updateSpec=(index,key,value)=>setForm(prev=>({ ...prev, specifications: prev.specifications.map((spec,i)=>i===index?{...spec,[key]:value}:spec) }));
  const addSpec=()=>setForm(prev=>({ ...prev, specifications:[...prev.specifications,createSpec()] }));
  const removeSpec=(index)=>setForm(prev=>({ ...prev, specifications: prev.specifications.length===1?[createSpec()]:prev.specifications.filter((_,i)=>i!==index) }));
  const onCategoryChange=(value)=>setForm(prev=>({
    ...prev,
    category:value,
    specifications:prev.specifications.map((spec)=>getSpecificationFields(getResolvedSpecificationName(spec),spec.value,value,specificationOptionsMap))
  }));
  const onProductNameOptionChange=(value)=>setForm(prev=>({ ...prev, productNameOption:value, customProductName:value===OTHER_PRODUCT_OPTION?prev.customProductName:'' }));
  const onCustomProductNameChange=(value)=>setForm(prev=>({ ...prev, customProductName:value }));
  const onAddProductName=()=>{
    const nextName=window.prompt('Enter new product name');
    const normalizedName=nextName?.trim();
    if(!normalizedName) return;
    if(productNameOptions.some(option=>option.toLowerCase()===normalizedName.toLowerCase())){
      toast.error('Product name already exists');
      return;
    }
    setProductNameOptions(prev=>[...prev,normalizedName]);
    setForm(prev=>({ ...prev, productNameOption:normalizedName, customProductName:'' }));
  };
  const onEditProductName=()=>{
    if(!canManageSelectedProduct){
      toast.error('Select a product name to edit');
      return;
    }
    const nextName=window.prompt('Rename product name',selectedProductOption);
    const normalizedName=nextName?.trim();
    if(!normalizedName||normalizedName===selectedProductOption) return;
    if(productNameOptions.some(option=>option!==selectedProductOption&&option.toLowerCase()===normalizedName.toLowerCase())){
      toast.error('Product name already exists');
      return;
    }
    setProductNameOptions(prev=>prev.map(option=>option===selectedProductOption?normalizedName:option));
    setForm(prev=>({ ...prev, productNameOption:normalizedName, customProductName:'' }));
  };
  const onDeleteProductNameOption=()=>{
    if(!canManageSelectedProduct){
      toast.error('Select a product name to delete');
      return;
    }
    if(!window.confirm(`Delete "${selectedProductOption}" from the product list?`)) return;
    setProductNameOptions(prev=>prev.filter(option=>option!==selectedProductOption));
    setForm(prev=>({ ...prev, productNameOption:'', customProductName:'' }));
  };
  const onAddCategoryOption=()=>{
    const nextCategory=window.prompt('Enter new category');
    const normalizedCategory=nextCategory?.trim();
    if(!normalizedCategory) return;
    if(categoryOptions.some(option=>option.toLowerCase()===normalizedCategory.toLowerCase())){
      toast.error('Category already exists');
      return;
    }
    setCategoryOptions(prev=>[...prev,normalizedCategory]);
    setSpecificationOptionsMap(prev=>({
      ...prev,
      [normalizedCategory]:[OTHER_SPECIFICATION_OPTION]
    }));
    setForm(prev=>({
      ...prev,
      category:normalizedCategory,
      specifications:prev.specifications.map((spec)=>getSpecificationFields(getResolvedSpecificationName(spec),spec.value,normalizedCategory,{...specificationOptionsMap,[normalizedCategory]:[OTHER_SPECIFICATION_OPTION]}))
    }));
  };
  const onEditCategoryOption=()=>{
    if(!form.category){
      toast.error('Select a category to edit');
      return;
    }
    const nextCategory=window.prompt('Rename category',form.category);
    const normalizedCategory=nextCategory?.trim();
    if(!normalizedCategory||normalizedCategory===form.category) return;
    if(categoryOptions.some(option=>option!==form.category&&option.toLowerCase()===normalizedCategory.toLowerCase())){
      toast.error('Category already exists');
      return;
    }
    setCategoryOptions(prev=>prev.map(option=>option===form.category?normalizedCategory:option));
    setSpecificationOptionsMap(prev=>{
      const next={...prev};
      next[normalizedCategory]=next[form.category]?[...next[form.category]]:[OTHER_SPECIFICATION_OPTION];
      delete next[form.category];
      return next;
    });
    setForm(prev=>({ ...prev, category:normalizedCategory }));
  };
  const onDeleteCategoryOption=()=>{
    if(!form.category){
      toast.error('Select a category to delete');
      return;
    }
    if(!window.confirm(`Delete "${form.category}" from the category list?`)) return;
    setCategoryOptions(prev=>prev.filter(option=>option!==form.category));
    setSpecificationOptionsMap(prev=>{
      const next={...prev};
      delete next[form.category];
      return next;
    });
    setForm(prev=>({ ...prev, category:'', specifications:[createSpec()] }));
  };
  const onFeatureOptionChange=(index,value)=>setForm(prev=>({ ...prev, features: prev.features.map((feature,i)=>i===index?{ ...feature, option:value, customValue:value===OTHER_FEATURE_OPTION?feature.customValue:'' }:feature) }));
  const onCustomFeatureChange=(index,value)=>updateFeature(index,'customValue',value);
  const onAddFeatureOption=(index)=>{
    const nextFeature=window.prompt('Enter new feature');
    const normalizedFeature=nextFeature?.trim();
    if(!normalizedFeature) return;
    if(featureOptions.some(option=>option.toLowerCase()===normalizedFeature.toLowerCase())){
      toast.error('Feature already exists');
      return;
    }
    setFeatureOptions(prev=>[...prev,normalizedFeature]);
    setForm(prev=>({ ...prev, features: prev.features.map((feature,i)=>i===index?{ ...feature, option:normalizedFeature, customValue:'' }:feature) }));
  };
  const onEditFeatureOption=(index)=>{
    const selectedOption=form.features[index]?.option;
    if(!selectedOption||selectedOption===OTHER_FEATURE_OPTION){
      toast.error('Select a feature to edit');
      return;
    }
    const nextFeature=window.prompt('Rename feature',selectedOption);
    const normalizedFeature=nextFeature?.trim();
    if(!normalizedFeature||normalizedFeature===selectedOption) return;
    if(featureOptions.some(option=>option!==selectedOption&&option.toLowerCase()===normalizedFeature.toLowerCase())){
      toast.error('Feature already exists');
      return;
    }
    setFeatureOptions(prev=>prev.map(option=>option===selectedOption?normalizedFeature:option));
    setForm(prev=>({ ...prev, features: prev.features.map(feature=>feature.option===selectedOption?{ ...feature, option:normalizedFeature }:feature) }));
  };
  const onDeleteFeatureOption=(index)=>{
    const selectedOption=form.features[index]?.option;
    if(!selectedOption||selectedOption===OTHER_FEATURE_OPTION){
      toast.error('Select a feature to delete');
      return;
    }
    if(!window.confirm(`Delete "${selectedOption}" from the feature list?`)) return;
    setFeatureOptions(prev=>prev.filter(option=>option!==selectedOption));
    setForm(prev=>({ ...prev, features: prev.features.map((feature,i)=>feature.option===selectedOption?{ ...feature, option:i===index?'':feature.option, customValue:'' }:feature) }));
  };
  const onSpecificationOptionChange=(index,value)=>setForm(prev=>({
    ...prev,
    specifications:prev.specifications.map((spec,i)=>i===index?{ ...spec, option:value, customName:value===OTHER_SPECIFICATION_OPTION?spec.customName:'' }:spec)
  }));
  const onCustomSpecificationNameChange=(index,value)=>updateSpec(index,'customName',value);
  const onAddSpecificationOption=(index)=>{
    if(!form.category){
      toast.error('Select a category first');
      return;
    }
    const nextSpecification=window.prompt('Enter new specification name');
    const normalizedSpecification=nextSpecification?.trim();
    if(!normalizedSpecification) return;
    if(currentSpecificationOptions.some(option=>option.toLowerCase()===normalizedSpecification.toLowerCase())){
      toast.error('Specification already exists');
      return;
    }
    const nextOptions=[
      ...currentSpecificationOptions.filter(option=>option!==OTHER_SPECIFICATION_OPTION),
      normalizedSpecification,
      OTHER_SPECIFICATION_OPTION
    ];
    setSpecificationOptionsMap(prev=>({ ...prev, [form.category]:nextOptions }));
    setForm(prev=>({
      ...prev,
      specifications:prev.specifications.map((spec,i)=>i===index?{ ...spec, option:normalizedSpecification, customName:'' }:spec)
    }));
  };
  const onEditSpecificationOption=(index)=>{
    if(!form.category){
      toast.error('Select a category first');
      return;
    }
    const selectedOption=form.specifications[index]?.option;
    if(!selectedOption||selectedOption===OTHER_SPECIFICATION_OPTION){
      toast.error('Select a specification to edit');
      return;
    }
    const nextSpecification=window.prompt('Rename specification',selectedOption);
    const normalizedSpecification=nextSpecification?.trim();
    if(!normalizedSpecification||normalizedSpecification===selectedOption) return;
    if(currentSpecificationOptions.some(option=>option!==selectedOption&&option.toLowerCase()===normalizedSpecification.toLowerCase())){
      toast.error('Specification already exists');
      return;
    }
    setSpecificationOptionsMap(prev=>({
      ...prev,
      [form.category]:prev[form.category].map(option=>option===selectedOption?normalizedSpecification:option)
    }));
    setForm(prev=>({
      ...prev,
      specifications:prev.specifications.map((spec)=>spec.option===selectedOption?{ ...spec, option:normalizedSpecification }:spec)
    }));
  };
  const onDeleteSpecificationOption=(index)=>{
    if(!form.category){
      toast.error('Select a category first');
      return;
    }
    const selectedOption=form.specifications[index]?.option;
    if(!selectedOption||selectedOption===OTHER_SPECIFICATION_OPTION){
      toast.error('Select a specification to delete');
      return;
    }
    if(!window.confirm(`Delete "${selectedOption}" from the specification list?`)) return;
    setSpecificationOptionsMap(prev=>({
      ...prev,
      [form.category]:prev[form.category].filter(option=>option!==selectedOption)
    }));
    setForm(prev=>({
      ...prev,
      specifications:prev.specifications.map((spec)=>spec.option===selectedOption?{ ...spec, option:'', customName:'' }:spec)
    }));
  };

  const onSubmit=async(e)=>{
    e.preventDefault();
    if(!isEdit&&!images.length){ toast.error('Upload at least one image'); return; }
    const resolvedProductName=getResolvedProductName(form);
    if(!resolvedProductName){ toast.error(form.productNameOption===OTHER_PRODUCT_OPTION?'Enter new product name':'Select Product Name'); return; }
    if(!form.category){ toast.error('Select Category'); return; }
    if(form.features.some(feature=>feature.option===OTHER_FEATURE_OPTION&&!feature.customValue.trim())){ toast.error('Enter new feature name'); return; }
    if(form.specifications.some(spec=>spec.option===OTHER_SPECIFICATION_OPTION&&!spec.customName.trim())){ toast.error('Enter new specification name'); return; }
    const resolvedSpecifications=form.specifications
      .map((spec)=>({ name:getResolvedSpecificationName(spec), value:String(spec.value||'').trim() }))
      .filter((spec)=>spec.name&&spec.value);
    const fd=new FormData();
    fd.append('name',resolvedProductName);
    fd.append('price',form.price);
    fd.append('brand',form.brand);
    fd.append('category',form.category);
    fd.append('countInStock',form.countInStock);
    fd.append('description',form.description);
    fd.append('codAvailable',form.codAvailable);
    fd.append('features',JSON.stringify(form.features.map(getResolvedFeatureValue).filter(Boolean)));
    fd.append('specifications',JSON.stringify(resolvedSpecifications));
    images.forEach(file=>fd.append('images',file));
    setSaving(true);
    try{
      if(isEdit){ await updateProduct(id,fd); toast.success('Product updated'); }
      else { await createProduct(fd); toast.success('Product created'); }
      setImages([]); setForm(emptyForm); setCategoryOptions(CATEGORY_OPTIONS); setSpecificationOptionsMap(cloneSpecificationOptionsMap()); navigate('/admin/manage-products');
    }catch(err){ toast.error(err.message||'Save failed'); }
    finally{ setSaving(false); }
  };

  const sidebar=isSeller?[
    ['overview','/admin',LayoutDashboard,'Overview'],
    ['inventory','/admin/manage-products',Package,'Inventory'],
    ['form','/admin/add-product',Plus,isEdit?'Edit Product':'Add Product'],
    ['upload-stock-sheet','/admin/upload-stock-sheet',FileSpreadsheet,'Upload Stock Sheet'],
    ['offline-sales','/admin/offline-sales',ReceiptIndianRupee,'Offline Sales'],
    ['sales-report','/admin/sales-report',BarChart3,'Sales Report'],
    ['orders','/admin/orders',Users,'Orders']
  ]:[['orders','/profile',ShoppingBag,'Order History']];

  return <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pt-24 pb-16"><div className="container-bound flex flex-col lg:flex-row gap-8 lg:gap-12">
    <aside className="w-full lg:w-72 shrink-0"><div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border sticky top-28">
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-dark-border"><div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-red-400 flex items-center justify-center text-white text-2xl font-black">{userInfo.name?.charAt(0).toUpperCase()}</div><div><h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{userInfo.name}</h3><p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">{isSeller?'Approved Seller':'Customer Account'}</p></div></div>
      <div className="space-y-2">{sidebar.map(([key,path,Icon,label])=><button key={key} onClick={()=>navigate(path)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-sm ${tab===key||((key==='form')&&isEdit)?'bg-primary-600 text-white':'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-bg'}`}><Icon size={18}/>{label}</button>)}</div>
      <button onClick={onLogout} className="w-full mt-8 pt-8 border-t border-slate-100 dark:border-dark-border text-red-500 font-bold text-sm">Sign Out</button>
    </div></aside>
    <main className="flex-1 min-w-0 space-y-8">
      <section className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border"><h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{isSeller?'Store Operations':'Your Orders'}</h2><p className="text-slate-500 dark:text-slate-400">{isSeller?'Manage products, monitor orders, and keep the catalog reliable.':'Track your purchases, payment status, and delivery progress.'}</p></section>

      {isSeller&&tab==='overview'&&<section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">{[[Package,'Total Products',products.length],[ShoppingBag,'Pending Orders',orders.filter(o=>!o.isDelivered).length],[CheckCircle2,'Delivered Orders',orders.filter(o=>o.isDelivered).length],[Users,'Seller Accounts',2]].map(([Icon,label,value])=><div key={label} className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border"><div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-4"><Icon size={22}/></div><p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{label}</p><p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p></div>)}</section>}

      {isSeller&&(tab==='overview'||tab==='inventory')&&<section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden"><div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row justify-between gap-4"><div><h3 className="text-2xl font-bold text-slate-900 dark:text-white">Product Inventory</h3><p className="text-slate-500 dark:text-slate-400 mt-1">Products are loaded directly from MongoDB and stay persistent across refresh and relogin.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 text-slate-400" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white"/></div></div><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest"><th className="px-6 py-5 border-b">Product</th><th className="px-6 py-5 border-b text-center">Price</th><th className="px-6 py-5 border-b text-center">Category</th><th className="px-6 py-5 border-b text-center">Stock</th><th className="px-6 py-5 border-b text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-border">{filtered.map(item=><tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-dark-bg/50"><td className="px-6 py-4"><div className="flex items-center gap-4"><img src={getPrimaryProductImage(item)} alt={item.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-dark-border shadow-sm ring-1 ring-slate-100 dark:ring-dark-border" onError={e=>{e.currentTarget.src=getPrimaryProductImage({});}}/><div><p className="font-bold text-slate-900 dark:text-white">{item.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{item.brand}</p></div></div></td><td className="px-6 py-4 text-center"><div className="inline-flex flex-col items-center"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Selling Price</span><span className="text-lg font-extrabold text-slate-900 dark:text-white">{formatPrice(item.price)}</span></div></td><td className="px-6 py-4 text-center"><span className="bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider">{item.category}</span></td><td className="px-6 py-4 text-center">{item.countInStock>0?<span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-2 rounded-full text-xs border border-emerald-200 dark:border-emerald-900/40 inline-flex items-center gap-1.5 shadow-sm"><CheckCircle2 size={14}/>{item.countInStock} in stock</span>:<span className="text-red-600 dark:text-red-300 font-bold bg-red-50 dark:bg-red-900/20 px-3.5 py-2 rounded-full text-xs border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1.5 shadow-sm"><XCircle size={14}/>Out of stock</span>}</td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={()=>navigate(`/admin/edit-product/${item._id}`)} className="p-3 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl border border-slate-200 dark:border-dark-border transition-all shadow-sm hover:shadow-md"><Edit size={16}/></button><button onClick={()=>onDelete(item._id)} className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-slate-200 dark:border-dark-border transition-all shadow-sm hover:shadow-md"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div></section>}

      {isSeller&&tab==='orders'&&<section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden"><div className="p-6 md:p-8 border-b"><h3 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Orders</h3></div><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest"><th className="px-6 py-5 border-b">Customer</th><th className="px-6 py-5 border-b text-center">Date</th><th className="px-6 py-5 border-b text-center">Amount</th><th className="px-6 py-5 border-b text-center">Payment</th><th className="px-6 py-5 border-b text-right">Delivery</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-border">{orders.map(order=><tr key={order._id}><td className="px-6 py-4"><p className="font-bold text-slate-900 dark:text-white">{order.user?.name||'Customer'}</p><p className="text-xs text-slate-500 dark:text-slate-400">#{order._id.slice(-8).toUpperCase()}</p></td><td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">{order.createdAt?.substring(0,10)}</td><td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{formatPrice(order.totalPrice)}</td><td className="px-6 py-4 text-center"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isPaid?'bg-blue-50 text-blue-600 border-blue-200':'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{order.isPaid?'Paid':'Pending'}</span></td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">{order.isDelivered?<span className="text-green-600 font-bold">Delivered</span>:<button onClick={()=>onDeliver(order._id)} className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl">Mark Delivered</button>}<button onClick={()=>onDeleteOrder(order._id)} className="text-xs font-bold text-red-500 border border-slate-200 dark:border-dark-border hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl">Delete</button></div></td></tr>)}</tbody></table></div></section>}

      {isSeller&&tab==='upload-stock-sheet'&&<UploadStockSheetSection />}

      {isSeller&&tab==='offline-sales'&&<OfflineSalesSection />}

      {isSeller&&tab==='sales-report'&&<SalesReportSection />}

      {isSeller&&(tab==='form'||tab==='edit')&&<form onSubmit={onSubmit} className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border p-6 md:p-8 space-y-6"><div><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{isEdit?'Edit Product':'Create New Product'}</h3><p className="text-slate-500 dark:text-slate-400 mt-1">{isEdit?'Update product details and replace images only if needed.':'Publish products directly to the live catalog with persistent MongoDB storage.'}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Product Name</label><div className="flex items-center gap-2"><button type="button" onClick={onAddProductName} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Add</button><button type="button" onClick={onEditProductName} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Edit</button><button type="button" onClick={onDeleteProductNameOption} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Delete</button></div></div><select value={form.productNameOption} onChange={e=>onProductNameOptionChange(e.target.value)} required className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"><option value="" disabled>Select Product Name</option>{productNameOptions.map(option=><option key={option} value={option}>{option}</option>)}<option value={OTHER_PRODUCT_OPTION}>{OTHER_PRODUCT_OPTION}</option></select></div><input type="number" step="0.01" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} required placeholder="Price" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"/>{form.productNameOption===OTHER_PRODUCT_OPTION&&<div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Custom Product Name</label><input value={form.customProductName} onChange={e=>onCustomProductNameChange(e.target.value)} required placeholder="Enter new product name" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/></div>}<input value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))} required placeholder="Brand" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/><div className="space-y-2"><div className="flex items-center justify-between gap-3"><label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Category</label><div className="flex items-center gap-2"><button type="button" onClick={onAddCategoryOption} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Add</button><button type="button" onClick={onEditCategoryOption} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Edit</button><button type="button" onClick={onDeleteCategoryOption} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Delete</button></div></div><select value={form.category} onChange={e=>onCategoryChange(e.target.value)} required className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"><option value="" disabled>Select Category</option>{categoryOptions.map(option=><option key={option} value={option}>{option}</option>)}</select></div><input type="number" value={form.countInStock} onChange={e=>setForm(p=>({...p,countInStock:e.target.value}))} required placeholder="Stock Count" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/><label className="flex items-center gap-3 px-4 py-3 border rounded-xl bg-slate-50 dark:bg-dark-bg text-sm font-medium"><input type="checkbox" checked={form.codAvailable} onChange={e=>setForm(p=>({...p,codAvailable:e.target.checked}))}/>Allow COD</label><div className="md:col-span-2 space-y-3"><h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Key Features</h4><div className="space-y-3">{form.features.map((feature,index)=><div key={feature.id} className="space-y-3"><div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Feature</span><div className="flex items-center gap-2"><button type="button" onClick={()=>onAddFeatureOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Add</button><button type="button" onClick={()=>onEditFeatureOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Edit</button><button type="button" onClick={()=>onDeleteFeatureOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Delete</button></div></div><select value={feature.option} onChange={e=>onFeatureOptionChange(index,e.target.value)} className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"><option value="" disabled>Select Feature</option>{featureOptions.map(option=><option key={option} value={option}>{option}</option>)}<option value={OTHER_FEATURE_OPTION}>{OTHER_FEATURE_OPTION}</option></select>{feature.option===OTHER_FEATURE_OPTION&&<input value={feature.customValue} onChange={e=>onCustomFeatureChange(index,e.target.value)} placeholder="Enter new feature" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/>}</div><button type="button" onClick={()=>removeFeature(index)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">Remove</button></div></div>)}</div><button type="button" onClick={addFeature} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border font-bold text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10"><Plus size={16}/>Add Feature</button></div><div className="md:col-span-2 space-y-3"><h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Specifications</h4><div className="space-y-3">{form.specifications.map((spec,index)=><div key={spec.id} className="space-y-3"><div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Specification Name</span><div className="flex items-center gap-2"><button type="button" onClick={()=>onAddSpecificationOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Add</button><button type="button" onClick={()=>onEditSpecificationOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Edit</button><button type="button" onClick={()=>onDeleteSpecificationOption(index)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg">Delete</button></div></div><select value={spec.option} onChange={e=>onSpecificationOptionChange(index,e.target.value)} className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"><option value="" disabled>Select Specification Name</option>{currentSpecificationOptions.map(option=><option key={`${form.category}-${option}`} value={option}>{option}</option>)}</select>{spec.option===OTHER_SPECIFICATION_OPTION&&<input value={spec.customName} onChange={e=>onCustomSpecificationNameChange(index,e.target.value)} placeholder="Enter new specification name" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/>}</div><input value={spec.value} onChange={e=>updateSpec(index,'value',e.target.value)} placeholder="Specification value" className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/><button type="button" onClick={()=>removeSpec(index)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">Remove</button></div></div>)}</div><button type="button" onClick={addSpec} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border font-bold text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10"><Plus size={16}/>Add Specification</button></div><div className="md:col-span-2 space-y-3">{isEdit&&product?.images?.length>0&&!images.length&&<div className="flex flex-wrap gap-3">{product.images.map((img,i)=><img key={i} src={getImageUrl(img)} alt={`Existing ${i+1}`} className="w-20 h-20 rounded-2xl object-cover border"/>)}</div>}<input type="file" accept="image/*" multiple onChange={onFiles} className="w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/>{images.length>0&&<p className="text-xs text-slate-500 dark:text-slate-400">{images.length} new image(s) selected</p>}</div><textarea rows="4" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required placeholder="Description" className="md:col-span-2 w-full bg-slate-50 dark:bg-dark-bg border rounded-xl px-4 py-3 text-sm"/></div><div className="pt-2 flex justify-end gap-3"><button type="button" onClick={()=>{setImages([]); setForm(emptyForm); setCategoryOptions(CATEGORY_OPTIONS); setProductNameOptions(PRODUCT_NAME_OPTIONS); setFeatureOptions(FEATURE_OPTIONS); setSpecificationOptionsMap(cloneSpecificationOptionsMap()); navigate('/admin/manage-products');}} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-bg">Cancel</button><button type="submit" disabled={saving} className="btn-primary px-8 shadow-lg shadow-primary-600/20 disabled:opacity-60">{saving?'Saving...':isEdit?'Update Product':'Publish Product'}</button></div></form>}

      {!isSeller&&<section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">{orders.length===0?<div className="p-12 text-center"><div className="w-20 h-20 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6 mx-auto text-slate-300"><Package size={32}/></div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h3><p className="text-slate-500 mb-6">Start shopping and your confirmed orders will appear here.</p><Link to="/shop" className="btn-primary h-12 px-8">Shop Premium Gear</Link></div>:<div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest"><th className="px-6 py-5 border-b">Order</th><th className="px-6 py-5 border-b text-center">Date</th><th className="px-6 py-5 border-b text-center">Total</th><th className="px-6 py-5 border-b text-center">Payment</th><th className="px-6 py-5 border-b text-right">Delivery</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-border">{orders.map(order=><tr key={order._id}><td className="px-6 py-5"><p className="font-bold text-slate-900 dark:text-white">#{order._id.slice(-8).toUpperCase()}</p><p className="text-xs text-slate-500 dark:text-slate-400">{order.paymentMethod}</p></td><td className="px-6 py-5 text-center text-slate-600 dark:text-slate-400"><span className="inline-flex items-center gap-2"><Clock size={14} className="text-slate-400"/>{order.createdAt?.substring(0,10)}</span></td><td className="px-6 py-5 text-center font-extrabold text-slate-900 dark:text-white">{formatPrice(order.totalPrice)}</td><td className="px-6 py-5 text-center"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isPaid?'bg-blue-50 text-blue-600 border-blue-200':'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{order.isPaid?'Paid':'Pending'}</span></td><td className="px-6 py-5 text-right"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isDelivered?'bg-green-50 text-green-600 border-green-200':'bg-slate-100 text-slate-600 border-slate-200 dark:bg-dark-bg dark:border-dark-border'}`}>{order.isDelivered?'Delivered':'In Transit'}</span></td></tr>)}</tbody></table></div>}</section>}
    </main>
  </div></div>;
};

export default Dashboard;

