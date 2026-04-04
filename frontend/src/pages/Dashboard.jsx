import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, Bell, CheckCircle2, ChevronDown, ChevronRight, Clock, Edit, FileSpreadsheet, HelpCircle, ImagePlus, LogOut, Menu, Package, Plus, ReceiptIndianRupee, Search, Settings, ShoppingBag, Sparkles, Trash2, Wallet, Wrench, Users, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore, useOrderStore, useProductStore } from '../store/useStore';
import { getImageUrl, getPrimaryProductImage } from '../utils/media';
import { formatPrice } from '../utils/price';
import UploadStockSheetSection from '../components/admin/UploadStockSheetSection';
import OfflineSalesSection from '../components/admin/OfflineSalesSection';
import SalesReportSection from '../components/admin/SalesReportSection';
import BatRepairSection from '../components/admin/BatRepairSection';
import BusinessSummarySection from '../components/admin/BusinessSummarySection';
import ExpenseManagementSection from '../components/admin/ExpenseManagementSection';
import StockInwardSection from '../components/admin/StockInwardSection';

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
const emptyForm={name:'',productNameOption:'',customProductName:'',price:'',brand:'',category:'',countInStock:'',pieceEnabled:true,boxEnabled:false,piecesPerBox:'1',description:'',codAvailable:true,features:[createFeature()],specifications:[createSpec()]};
const DASHBOARD_WEEK_DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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
  const [generatingDetails,setGeneratingDetails]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [isProductNameMenuOpen,setIsProductNameMenuOpen]=useState(false);
  const productNameMenuRef=useRef(null);
  const isSeller=userInfo?.role==='seller';
  const isEdit=Boolean(id);
  const tab=!isSeller
    ?'orders'
    :location.pathname.includes('/business-summary')
      ?'business-summary'
    :location.pathname.includes('/upload-stock-sheet')
      ?'upload-stock-sheet'
      :location.pathname.includes('/stock-inward')
        ?'stock-inward'
      :location.pathname.includes('/offline-sales')
        ?'offline-sales'
        :location.pathname.includes('/bat-repair')
          ?'bat-repair'
          :location.pathname.includes('/expenses')
            ?'expenses'
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

  useEffect(()=>{
    if(isSeller){
      if(tab==='overview'){
        Promise.all([fetchProducts(),fetchAllOrders()]).catch(()=>{});
      }else if(tab==='orders'){
        fetchAllOrders().catch(()=>{});
      }else{
        fetchProducts().catch(()=>{});
      }
    } else {
      fetchMyOrders().catch(()=>{});
    }
  },[isSeller,tab,fetchAllOrders,fetchMyOrders,fetchProducts]);
  useEffect(()=>{ if(isSeller&&isEdit&&id){ fetchProductById(id).catch(e=>{ toast.error(e.message||'Failed to load product'); navigate('/admin/manage-products',{replace:true});}); } else { setForm(emptyForm);} },[isSeller,isEdit,id,fetchProductById,navigate]);
  useEffect(()=>{ setSidebarOpen(false); },[location.pathname]);
  useEffect(()=>{
    const handleClickOutside=(event)=>{
      if(productNameMenuRef.current&&!productNameMenuRef.current.contains(event.target)){
        setIsProductNameMenuOpen(false);
      }
    };
    document.addEventListener('mousedown',handleClickOutside);
    return ()=>document.removeEventListener('mousedown',handleClickOutside);
  },[]);
  useEffect(()=>{ setIsProductNameMenuOpen(false); },[location.pathname]);
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
        pieceEnabled:product.pieceEnabled!==false,
        boxEnabled:product.boxEnabled===true,
        piecesPerBox:String(product.piecesPerBox||1),
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

  const totalSales=orders.reduce((sum,order)=>sum+Number(order.totalPrice||0),0);
  const pendingAmount=orders.reduce((sum,order)=>!order.isPaid?sum+Number(order.totalPrice||0):sum,0);
  const paidSales=orders.reduce((sum,order)=>order.isPaid?sum+Number(order.totalPrice||0):sum,0);
  const netProfitEstimate=paidSales*0.22;
  const todayLabel=new Intl.DateTimeFormat('en-IN',{ day:'2-digit', month:'short', year:'numeric' }).format(new Date());
  const pageTitleMap={
    overview:'Dashboard',
    inventory:'Inventory',
    form:'Inventory',
    edit:'Inventory',
    'upload-stock-sheet':'Upload Stock Sheet',
    'stock-inward':'Stock Inward',
    'offline-sales':'Offline Sales',
    'bat-repair':'Bat Repair',
    expenses:'Expenses',
    'business-summary':'Summary',
    'sales-report':'Sales Report',
    orders:'Orders'
  };
  const pageTitle=pageTitleMap[tab] || 'Dashboard';
  const overviewCards=[
    { label:'Total Sales', value:formatPrice(totalSales), note:`${orders.length} recorded orders`, accent:'text-emerald-300', tone:'bg-emerald-500/15', icon:ReceiptIndianRupee },
    { label:'Net Profit', value:formatPrice(netProfitEstimate), note:'Estimated from paid order flow', accent:'text-sky-300', tone:'bg-sky-500/15', icon:Wallet },
    { label:'Pending Amount', value:formatPrice(pendingAmount), note:`${orders.filter(order=>!order.isPaid).length} payments awaiting`, accent:'text-amber-300', tone:'bg-amber-500/15', icon:Clock },
    { label:'Total Orders', value:String(orders.length), note:`${orders.filter(order=>order.isDelivered).length} delivered so far`, accent:'text-rose-300', tone:'bg-rose-500/15', icon:ShoppingBag }
  ];
  const weeklySalesData=DASHBOARD_WEEK_DAYS.map((day,dayIndex)=>{
    const amount=orders.reduce((sum,order)=>{
      if(!order.createdAt) return sum;
      const orderDay=new Date(order.createdAt).getDay();
      const normalizedDay=orderDay===0?6:orderDay-1;
      return normalizedDay===dayIndex?sum+Number(order.totalPrice||0):sum;
    },0);
    return { day, amount };
  });
  const peakWeeklySales=Math.max(...weeklySalesData.map(item=>item.amount),1);
  const topInventoryItems=[...products]
    .sort((a,b)=>(Number(b.price||0)*Math.max(Number(b.countInStock||0),1))-(Number(a.price||0)*Math.max(Number(a.countInStock||0),1)))
    .slice(0,4);
  const recentTransactions=[...orders]
    .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))
    .slice(0,5);

  const onLogout=async()=>{ await logout(); navigate('/login',{replace:true}); };
  const onDelete=async(pid)=>{ if(!window.confirm('Delete this product permanently?')) return; try{ await deleteProduct(pid); toast.success('Product deleted'); }catch(e){ toast.error(e.message||'Delete failed'); } };
  const onDeliver=async(oid)=>{ try{ await deliverOrder(oid); toast.success('Order delivered'); }catch(e){ toast.error(e.message||'Update failed'); } };
  const onDeleteOrder=async(oid)=>{ if(!window.confirm('Are you sure you want to delete this order?')) return; try{ await deleteOrder(oid); toast.success('Order deleted'); }catch(e){ toast.error(e.message||'Delete failed'); } };
  const onFiles=(e)=>{ const files=Array.from(e.target.files||[]); if(images.length+files.length>4){ toast.error('Max 4 images'); return; } setImages(prev=>[...prev,...files]); e.target.value=null; };
  const onGenerateDetails=async()=>{
    const resolvedName=getResolvedProductName(form);
    if(!resolvedName){
      toast.error('Select or enter a product name first');
      return;
    }
    if(!form.category){
      toast.error('Select a category first');
      return;
    }
    setGeneratingDetails(true);
    try{
      const { data }=await api.post('/products/generate-details',{ name:resolvedName, category:form.category });
      setForm(prev=>({
        ...prev,
        description:data.description||prev.description,
        features:Array.isArray(data.features)&&data.features.length?data.features.map(getFeatureFields):prev.features,
        specifications:Array.isArray(data.specifications)&&data.specifications.length
          ? data.specifications.map((spec)=>getSpecificationFields(spec.name,spec.value,form.category,specificationOptionsMap))
          : prev.specifications
      }));
      toast.success('Product details generated');
    }catch(e){
      toast.error(e.response?.data?.message||e.message||'Failed to generate product details');
    }finally{
      setGeneratingDetails(false);
    }
  };
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
  const onProductNameOptionChange=(value)=>{
    setForm(prev=>({ ...prev, productNameOption:value, customProductName:value===OTHER_PRODUCT_OPTION?prev.customProductName:'' }));
    setIsProductNameMenuOpen(false);
  };
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
    if(!form.pieceEnabled&&!form.boxEnabled){ toast.error('Enable at least one unit type: Piece or Box'); return; }
    if(form.boxEnabled&&(!Number.isFinite(Number(form.piecesPerBox))||Number(form.piecesPerBox)<1)){ toast.error('Pieces per box must be at least 1'); return; }
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
    fd.append('pieceEnabled',form.pieceEnabled);
    fd.append('boxEnabled',form.boxEnabled);
    fd.append('piecesPerBox',form.piecesPerBox||'1');
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
    ['inventory','/admin/manage-products',Package,'Inventory'],
    ['stock-inward','/admin/stock-inward',Package,'Stock Inward'],
    ['offline-sales','/admin/offline-sales',ReceiptIndianRupee,'Offline Sales'],
    ['business-summary','/admin/business-summary',BarChart3,'Summary'],
    ['orders','/admin/orders',Users,'Orders'],
    ['bat-repair','/admin/bat-repair',Wrench,'Bat Repair'],
    ['expenses','/admin/expenses',Wallet,'Expenses'],
    ['sales-report','/admin/sales-report',BarChart3,'Sales Report']
  ]:[['orders','/profile',ShoppingBag,'Order History']];

  return <div className="min-h-screen bg-transparent pb-16">
    <div className="container-bound">
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <button onClick={()=>setSidebarOpen(prev=>!prev)} className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#121720] text-white shadow-[0_20px_40px_-24px_rgba(0,0,0,0.9)]">
          <Menu size={20}/>
        </button>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#121720] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-primary-300">K.S. Sports</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{pageTitle}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <aside className={`${sidebarOpen?'block':'hidden'} w-full shrink-0 lg:block lg:w-[290px]`}>
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f131b]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_58%)]"></div>
            <div className="relative">
              <div className="flex items-center gap-3 pb-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)]">KS</div>
                <div>
                  <p className="text-lg font-black uppercase tracking-tight text-white">K.S. Sports</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">Seller Console</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-red-400 text-xl font-black text-white">
                    {userInfo.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">{userInfo.name}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">{isSeller?'Premium Seller':'Customer Account'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Navigation</p>
                <div className="space-y-2">{sidebar.map((item,index)=>{const key=item[0]; const path=item[1]; const Icon=item[2]; const label=item[3]; const active=tab===key||((key==='inventory-tools')&&(tab==='form'||tab==='edit')); return <button key={`${key}-${index}`} onClick={()=>navigate(path)} className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-bold transition-all ${active?'border-primary-500/40 bg-primary-600 text-white shadow-[0_20px_44px_-24px_rgba(220,38,38,0.75)]':'border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'}`}><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active?'bg-white/15 text-white':'bg-white/[0.04] text-slate-400 group-hover:text-white'}`}><Icon size={18}/></span><span className="flex-1">{label}</span><ChevronRight size={16} className={active?'text-white':'text-slate-600 group-hover:text-slate-300'}/></button>;})}</div>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Quick Support</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Need help with stock, orders, or reports? Keep your storefront moving with faster admin actions.</p>
                <div className="mt-4 space-y-2">
                  <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-white/[0.06]"><HelpCircle size={18}/>Support</button>
                  <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/15"><LogOut size={18}/>Logout</button>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-300">K.S. Sports Dashboard</p>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">{isSeller ? (tab==='overview' ? 'Performance Hub' : pageTitle) : 'Your Orders'}</h1>
                <p className="mt-2 text-sm text-slate-400">{isSeller ? `Live operational view for ${todayLabel}. Monitor inventory, sales, and order flow in one place.` : 'Track your purchases, payment status, and delivery progress.'}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders, stock..." className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"><Bell size={18}/></button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"><Settings size={18}/></button>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-sm font-black text-white">{userInfo.name?.charAt(0).toUpperCase()}</div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-bold text-white">{userInfo.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{pageTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

      {isSeller&&tab==='overview'&&(
        <>
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((item)=>{const Icon=item.icon; return <div key={item.label} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/15"><div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary-600/10 blur-3xl"></div><div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone} ${item.accent}`}><Icon size={22}/></div><p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">{item.label}</p><p className="mt-4 text-3xl font-black tracking-tight text-white">{item.value}</p><p className="mt-2 text-sm text-slate-400">{item.note}</p></div>;})}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-7">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Revenue Trends</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Weekly Sales Performance</h3>
                </div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-xs font-bold uppercase tracking-[0.2em]">
                  <span className="rounded-full bg-white px-4 py-2 text-slate-900">Weekly</span>
                  <span className="px-4 py-2 text-slate-500">Monthly</span>
                </div>
              </div>
              <div className="flex h-[320px] items-end gap-3">
                {weeklySalesData.map((item)=><div key={item.day} className="flex flex-1 flex-col items-center gap-4"><div className="flex h-full w-full items-end justify-center rounded-[1.6rem] bg-white/[0.03] px-2 py-3"><div className="w-full rounded-[1rem] bg-gradient-to-t from-primary-600 via-rose-400 to-[#ffd2d2] shadow-[0_18px_38px_-20px_rgba(220,38,38,0.8)]" style={{ height: `${Math.max((item.amount/peakWeeklySales)*100,12)}%` }}></div></div><div className="text-center"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{item.day}</p><p className="mt-1 text-xs font-semibold text-slate-300">{formatPrice(item.amount)}</p></div></div>)}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Top Items</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Best Sellers</h3>
                </div>
                <button onClick={()=>navigate('/admin/manage-products')} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-white/20 hover:bg-white/[0.06]">View Inventory</button>
              </div>
              <div className="space-y-4">
                {topInventoryItems.map((item)=><div key={item._id} className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3"><img src={getPrimaryProductImage(item)} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" onError={e=>{e.currentTarget.src=getPrimaryProductImage({});}}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{item.name}</p><p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.category || 'Gear'} / {item.countInStock || 0} in stock</p></div><div className="text-right"><p className="text-sm font-black text-white">{formatPrice(item.price)}</p><p className="mt-1 text-xs font-semibold text-emerald-300">{Math.max(Number(item.countInStock||0),0)} units</p></div></div>)}
                {!topInventoryItems.length&&<div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">Top items will appear here once products are available.</div>}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#10151d]/95 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">Transactions</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Recent Transactions</h3>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Showing latest order flow</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead><tr className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500"><th className="px-6 py-4 md:px-8">Order ID</th><th className="px-6 py-4">Customer Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-right md:px-8">Action</th></tr></thead>
                <tbody className="divide-y divide-white/5">{recentTransactions.map((order)=><tr key={order._id} className="text-sm text-slate-300"><td className="px-6 py-5 md:px-8"><p className="font-bold text-white">#{order._id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{order.createdAt?.substring(0,10)}</p></td><td className="px-6 py-5"><p className="font-semibold text-white">{order.user?.name || 'Customer'}</p><p className="mt-1 text-xs text-slate-500">{order.user?.email || 'Order account'}</p></td><td className="px-6 py-5"><span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${order.isDelivered?'border-emerald-500/20 bg-emerald-500/10 text-emerald-300':order.isPaid?'border-sky-500/20 bg-sky-500/10 text-sky-300':'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>{order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'}</span></td><td className="px-6 py-5 text-right font-black text-white">{formatPrice(order.totalPrice)}</td><td className="px-6 py-5 text-right md:px-8"><button onClick={()=>navigate('/admin/orders')} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all hover:border-white/20 hover:bg-white/[0.06]">View</button></td></tr>)}
                {!recentTransactions.length&&<tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500 md:px-8">Recent transactions will appear here after orders start coming in.</td></tr>}</tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isSeller&&tab==='inventory'&&<section className="table-shell"><div className="p-6 md:p-8 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row justify-between gap-4"><div><h3 className="text-2xl font-bold text-slate-900 dark:text-white">Product Inventory</h3><p className="text-slate-500 dark:text-slate-400 mt-1">Products are loaded directly from MongoDB and stay persistent across refresh and relogin.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 text-slate-400" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." className="input-premium pl-10 pr-4 py-3"/></div></div><div className="overflow-x-auto"><table className="table-premium"><thead><tr><th>Product</th><th className="text-center">Price</th><th className="text-center">Category</th><th className="text-center">Stock</th><th className="text-right">Actions</th></tr></thead><tbody>{filtered.map(item=><tr key={item._id}><td><div className="flex items-center gap-4"><img src={getPrimaryProductImage(item)} alt={item.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-dark-border shadow-sm ring-1 ring-slate-100 dark:ring-dark-border" onError={e=>{e.currentTarget.src=getPrimaryProductImage({});}}/><div><p className="font-bold text-slate-900 dark:text-white">{item.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{item.brand}</p></div></div></td><td className="text-center"><div className="inline-flex flex-col items-center"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Selling Price</span><span className="text-lg font-extrabold text-slate-900 dark:text-white">{formatPrice(item.price)}</span></div></td><td className="text-center"><span className="bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider">{item.category}</span></td><td className="text-center">{item.countInStock>0?<span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-2 rounded-full text-xs border border-emerald-200 dark:border-emerald-900/40 inline-flex items-center gap-1.5 shadow-sm"><CheckCircle2 size={14}/>{item.countInStock} in stock</span>:<span className="text-red-600 dark:text-red-300 font-bold bg-red-50 dark:bg-red-900/20 px-3.5 py-2 rounded-full text-xs border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1.5 shadow-sm"><XCircle size={14}/>Out of stock</span>}</td><td className="text-right"><div className="flex items-center justify-end gap-2"><button onClick={()=>navigate(`/admin/edit-product/${item._id}`)} className="p-3 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl border border-slate-200 dark:border-dark-border transition-all shadow-sm hover:shadow-md"><Edit size={16}/></button><button onClick={()=>onDelete(item._id)} className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-slate-200 dark:border-dark-border transition-all shadow-sm hover:shadow-md"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div></section>}

      {isSeller&&tab==='orders'&&<section className="table-shell"><div className="p-6 md:p-8 border-b"><h3 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Orders</h3></div><div className="overflow-x-auto"><table className="table-premium"><thead><tr><th>Customer</th><th className="text-center">Date</th><th className="text-center">Amount</th><th className="text-center">Payment</th><th className="text-right">Delivery</th></tr></thead><tbody>{orders.map(order=><tr key={order._id}><td><p className="font-bold text-slate-900 dark:text-white">{order.user?.name||'Customer'}</p><p className="text-xs text-slate-500 dark:text-slate-400">#{order._id.slice(-8).toUpperCase()}</p></td><td className="text-center text-slate-600 dark:text-slate-400">{order.createdAt?.substring(0,10)}</td><td className="text-center font-bold text-slate-900 dark:text-white">{formatPrice(order.totalPrice)}</td><td className="text-center"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isPaid?'bg-blue-50 text-blue-600 border-blue-200':'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{order.isPaid?'Paid':'Pending'}</span></td><td className="text-right"><div className="flex items-center justify-end gap-2">{order.isDelivered?<span className="text-green-600 font-bold">Delivered</span>:<button onClick={()=>onDeliver(order._id)} className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl">Mark Delivered</button>}<button onClick={()=>onDeleteOrder(order._id)} className="text-xs font-bold text-red-500 border border-slate-200 dark:border-dark-border hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl">Delete</button></div></td></tr>)}</tbody></table></div></section>}

      {isSeller&&tab==='upload-stock-sheet'&&<UploadStockSheetSection />}

      {isSeller&&tab==='stock-inward'&&<StockInwardSection />}

      {isSeller&&tab==='offline-sales'&&<OfflineSalesSection />}

      {isSeller&&tab==='bat-repair'&&<BatRepairSection />}

      {isSeller&&tab==='expenses'&&<ExpenseManagementSection />}

      {isSeller&&tab==='business-summary'&&<BusinessSummarySection />}

      {isSeller&&tab==='sales-report'&&<SalesReportSection />}

      {isSeller&&(tab==='form'||tab==='edit')&&(
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_46%)]"></div>
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300">
                  Inventory Management
                </p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                  {isEdit?'Edit Product':'Add New Product'}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  {isEdit
                    ? 'Update product details, media, and specifications while preserving your current K.S. Sports inventory workflow.'
                    : 'Configure a new premium gear listing for the storefront using the existing product creation and upload flow.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={()=>{setImages([]); setForm(emptyForm); setCategoryOptions(CATEGORY_OPTIONS); setProductNameOptions(PRODUCT_NAME_OPTIONS); setFeatureOptions(FEATURE_OPTIONS); setSpecificationOptionsMap(cloneSpecificationOptionsMap()); navigate('/admin/manage-products');}} className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">Discard</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700 disabled:opacity-60">{saving?'Saving...':isEdit?'Save Changes':'Save Product'}</button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-8">
              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
                <div className="mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Basic Information</p>
                  <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Core Product Setup</h4>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Product Name</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={onAddProductName} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Add</button>
                  <button type="button" onClick={onEditProductName} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Edit</button>
                  <button type="button" onClick={onDeleteProductNameOption} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Delete</button>
                </div>
              </div>
              <div className="relative" ref={productNameMenuRef}>
                <button
                  type="button"
                  onClick={()=>setIsProductNameMenuOpen(prev=>!prev)}
                  className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm transition-all ${
                    isProductNameMenuOpen
                      ? 'border-primary-500/40 bg-[#151b24] shadow-[0_18px_36px_-24px_rgba(220,38,38,0.45)]'
                      : 'border-white/10 bg-[#151b24] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className={form.productNameOption ? 'truncate text-white' : 'truncate text-slate-500'}>
                    {form.productNameOption || 'Select Product Name'}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${isProductNameMenuOpen ? 'rotate-180 text-primary-300' : ''}`}
                  />
                </button>

                {isProductNameMenuOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#121821]/98 shadow-[0_28px_70px_-36px_rgba(0,0,0,0.98)] backdrop-blur-xl">
                    <div className="max-h-72 overflow-y-auto p-2">
                      {[...productNameOptions, OTHER_PRODUCT_OPTION].map(option=>(
                        <button
                          key={option}
                          type="button"
                          onClick={()=>onProductNameOptionChange(option)}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-all ${
                            form.productNameOption===option
                              ? 'bg-primary-500/12 text-white ring-1 ring-inset ring-primary-500/30'
                              : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <span className="truncate">{option}</span>
                          {form.productNameOption===option && (
                            <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.22em] text-primary-300">
                              Selected
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Price</label>
              <input type="number" step="0.01" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} required placeholder="Price" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
            </div>

            {form.productNameOption===OTHER_PRODUCT_OPTION&&(
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Custom Product Name</label>
                <input value={form.customProductName} onChange={e=>onCustomProductNameChange(e.target.value)} required placeholder="Enter new product name" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Brand</label>
              <input value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))} required placeholder="Brand" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Category</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={onAddCategoryOption} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Add</button>
                  <button type="button" onClick={onEditCategoryOption} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Edit</button>
                  <button type="button" onClick={onDeleteCategoryOption} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Delete</button>
                  <button type="button" onClick={onGenerateDetails} disabled={generatingDetails} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-60">
                    <Sparkles size={12}/>
                    {generatingDetails?'Generating...':'Generate Details'}
                  </button>
                </div>
              </div>
              <select value={form.category} onChange={e=>onCategoryChange(e.target.value)} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40">
                <option value="" disabled>Select Category</option>
                {categoryOptions.map(option=><option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Stock Count</label>
              <input type="number" value={form.countInStock} onChange={e=>setForm(p=>({...p,countInStock:e.target.value}))} required placeholder="Stock Count" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Unit Support</label>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                  <input type="checkbox" checked={form.pieceEnabled} onChange={e=>setForm(p=>({...p,pieceEnabled:e.target.checked}))} className="h-4 w-4 accent-primary-600"/>
                  Piece
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                  <input type="checkbox" checked={form.boxEnabled} onChange={e=>setForm(p=>({...p,boxEnabled:e.target.checked,piecesPerBox:e.target.checked?p.piecesPerBox||'6':'1'}))} className="h-4 w-4 accent-primary-600"/>
                  Box
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Pieces Per Box</label>
              <input type="number" min="1" value={form.piecesPerBox} onChange={e=>setForm(p=>({...p,piecesPerBox:e.target.value}))} disabled={!form.boxEnabled} placeholder="Pieces in one box" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"/>
            </div>

                </div>
              </section>

            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Product Details</p>
                <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Features & Specifications</h4>
              </div>

            <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Key Features</h4>
              <div className="space-y-4">
                {form.features.map((feature,index)=>(
                  <div key={feature.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-start">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Feature</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={()=>onAddFeatureOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Add</button>
                            <button type="button" onClick={()=>onEditFeatureOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Edit</button>
                            <button type="button" onClick={()=>onDeleteFeatureOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Delete</button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <select value={feature.option} onChange={e=>onFeatureOptionChange(index,e.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40">
                            <option value="" disabled>Select Feature</option>
                            {featureOptions.map(option=><option key={option} value={option}>{option}</option>)}
                            <option value={OTHER_FEATURE_OPTION}>{OTHER_FEATURE_OPTION}</option>
                          </select>
                          {feature.option===OTHER_FEATURE_OPTION&&<input value={feature.customValue} onChange={e=>onCustomFeatureChange(index,e.target.value)} placeholder="Enter new feature" className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>}
                        </div>
                      </div>
                      <button type="button" onClick={()=>removeFeature(index)} className="w-full xl:w-auto rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/15">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addFeature} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-bold text-sm text-primary-300 transition-all hover:border-white/20 hover:bg-white/[0.06]"><Plus size={16}/>Add Feature</button>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Specifications</h4>
              <div className="space-y-4">
                {form.specifications.map((spec,index)=>(
                  <div key={spec.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-start">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Specification</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={()=>onAddSpecificationOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Add</button>
                            <button type="button" onClick={()=>onEditSpecificationOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Edit</button>
                            <button type="button" onClick={()=>onDeleteSpecificationOption(index)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]">Delete</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-3">
                            <select value={spec.option} onChange={e=>onSpecificationOptionChange(index,e.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 text-sm text-white outline-none transition-all focus:border-primary-500/40">
                              <option value="" disabled>Select Specification Name</option>
                              {currentSpecificationOptions.map(option=><option key={`${form.category}-${option}`} value={option}>{option}</option>)}
                            </select>
                            {spec.option===OTHER_SPECIFICATION_OPTION&&<input value={spec.customName} onChange={e=>onCustomSpecificationNameChange(index,e.target.value)} placeholder="Enter new specification name" className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>}
                          </div>
                          <input value={spec.value} onChange={e=>updateSpec(index,'value',e.target.value)} placeholder="Specification value" className="h-12 w-full rounded-2xl border border-white/10 bg-[#151b24] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
                        </div>
                      </div>
                      <button type="button" onClick={()=>removeSpec(index)} className="w-full xl:w-auto rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/15">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addSpec} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-bold text-sm text-primary-300 transition-all hover:border-white/20 hover:bg-white/[0.06]"><Plus size={16}/>Add Specification</button>
            </div>
            </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Description</p>
                <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Storefront Content</h4>
              </div>
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Description</label>
              <textarea rows="5" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required placeholder="Describe the product, performance benefits, and any key selling points." className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-primary-500/40"/>
            </div>
            </section>
            </div>

            <aside className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Product Media</p>
                <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Image Uploads</h4>
              </div>

              <div className="space-y-5">
              {isEdit&&product?.images?.length>0&&!images.length&&(
                <div className="flex flex-wrap gap-4">
                  {product.images.map((img,i)=>(
                    <div key={i} className="h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-[#151b24] shadow-sm md:h-28 md:w-28">
                      <img src={getImageUrl(img)} alt={`Existing ${i+1}`} className="w-full h-full object-cover"/>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] px-6 py-8 text-center transition-all hover:border-primary-500/40 hover:bg-white/[0.05]">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/15 text-primary-300">
                  <ImagePlus size={24}/>
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.16em] text-white">Upload Product Images</span>
                <span className="mt-2 text-xs leading-6 text-slate-500">PNG, JPG or WEBP. Up to 4 images supported by the current uploader.</span>
                <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden"/>
              </label>
              {images.length>0&&<p className="text-xs text-slate-400">{images.length} new image(s) selected</p>}
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Visibility</p>
                <label className="mt-4 flex items-center gap-3 text-sm font-medium text-slate-200">
                  <input type="checkbox" checked={form.codAvailable} onChange={e=>setForm(p=>({...p,codAvailable:e.target.checked}))}/>
                  Allow COD for this product
                </label>
              </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10151d]/95 p-6 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl md:p-8">
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">Action Panel</p>
                <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Publish Controls</h4>
              </div>
              <div className="space-y-4">
                <button type="submit" disabled={saving} className="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-20px_rgba(220,38,38,0.75)] transition-all hover:bg-primary-700 disabled:opacity-60">{saving?'Saving...':isEdit?'Update Product':'Save Product'}</button>
                <button type="button" onClick={()=>{setImages([]); setForm(emptyForm); setCategoryOptions(CATEGORY_OPTIONS); setProductNameOptions(PRODUCT_NAME_OPTIONS); setFeatureOptions(FEATURE_OPTIONS); setSpecificationOptionsMap(cloneSpecificationOptionsMap()); navigate('/admin/manage-products');}} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.06]">Cancel</button>
              </div>
            </section>
            </aside>
          </div>
        </form>
      )}

      {!isSeller&&<section className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden">{orders.length===0?<div className="p-12 text-center"><div className="w-20 h-20 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6 mx-auto text-slate-300"><Package size={32}/></div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h3><p className="text-slate-500 mb-6">Start shopping and your confirmed orders will appear here.</p><Link to="/shop" className="btn-primary h-12 px-8">Shop Premium Gear</Link></div>:<div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/80 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest"><th className="px-6 py-5 border-b">Order</th><th className="px-6 py-5 border-b text-center">Date</th><th className="px-6 py-5 border-b text-center">Total</th><th className="px-6 py-5 border-b text-center">Payment</th><th className="px-6 py-5 border-b text-right">Delivery</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-dark-border">{orders.map(order=><tr key={order._id}><td className="px-6 py-5"><p className="font-bold text-slate-900 dark:text-white">#{order._id.slice(-8).toUpperCase()}</p><p className="text-xs text-slate-500 dark:text-slate-400">{order.paymentMethod}</p></td><td className="px-6 py-5 text-center text-slate-600 dark:text-slate-400"><span className="inline-flex items-center gap-2"><Clock size={14} className="text-slate-400"/>{order.createdAt?.substring(0,10)}</span></td><td className="px-6 py-5 text-center font-extrabold text-slate-900 dark:text-white">{formatPrice(order.totalPrice)}</td><td className="px-6 py-5 text-center"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isPaid?'bg-blue-50 text-blue-600 border-blue-200':'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{order.isPaid?'Paid':'Pending'}</span></td><td className="px-6 py-5 text-right"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${order.isDelivered?'bg-green-50 text-green-600 border-green-200':'bg-slate-100 text-slate-600 border-slate-200 dark:bg-dark-bg dark:border-dark-border'}`}>{order.isDelivered?'Delivered':'In Transit'}</span></td></tr>)}</tbody></table></div>}</section>}
    </main>
  </div></div></div>;
};

export default Dashboard;

