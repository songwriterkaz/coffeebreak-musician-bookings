'use strict';
/* Coffeebreak Musician Bookings: configuration. © Karen (Coffeebreak). */
const CFG={key:'cb-musician-bookings-v1',title:'Coffeebreak Musician Bookings',refPrefix:'MUS',hasRate:true,
 words:{venue:'studio',venues:'studios',venueCap:'Studio',person:'musician',personCap:'Musician',peopleCap:'Musicians, teachers and engineers'},
 extraFields:[{id:'inst',label:'Instrument or service',req:false},{id:'level',label:'Experience level',req:false}],
 defaultTypes:[{id:'les30',name:'Music lesson (30 min)',mins:30,price:40},{id:'les60',name:'Music lesson (60 min)',mins:60,price:70},{id:'studio',name:'Studio time (1 hour)',mins:60,price:60}],
 empty:()=>({venues:[],appts:[],waitlist:[],gigs:[],sample:false}),
 sample:()=>{const H=(a,b,days)=>{const o={};(days||[1,2,3,4,5,6]).forEach(d=>o[d]=[a,b]);return o};
  const v1={id:'m1',name:'Sample Harbour Music Studio',suburb:'Newcastle NSW',address:'10 Sample Lane (made up)',phone:'02 4000 0010',email:'hello@sample-harbour.example',payid:'bookings@sample-harbour.example',
   people:[{id:'p1',name:'Jess (guitar and vocals)',role:'Teacher',rate:90,hours:H('10:00','19:00')},{id:'p2',name:'Sam (piano and keys)',role:'Teacher',rate:90,hours:H('09:00','17:00',[1,3,5,6])},{id:'p3',name:'Alex (sound engineer)',role:'Engineer',rate:0,hours:H('10:00','22:00')},{id:'p4',name:'The Sample Trio (band)',role:'Band',rate:250,hours:H('12:00','23:00',[4,5,6,0])}],
   types:JSON.parse(JSON.stringify(CFG.defaultTypes)).concat([{id:'studio3',name:'Studio block (3 hours)',mins:180,price:160,step:60},{id:'mix',name:'Mixing session (2 hours)',mins:120,price:120,step:60},{id:'gig',name:'Gig or event performance (2 hours)',mins:120,price:450,step:60}])};
  v1.types.forEach(t=>{if(t.id.startsWith('les'))t.roles=['Teacher'];if(['studio','studio3','mix'].includes(t.id))t.roles=['Engineer'];if(t.id==='gig')t.roles=['Band','Teacher']});
  const v2={id:'m2',name:'Sample Valley Rehearsal Rooms',suburb:'Maitland NSW',address:'20 Example Street (made up)',phone:'02 4000 0020',email:'rooms@sample-valley.example',payid:'rooms@sample-valley.example',
   people:[{id:'p5',name:'Room A (drum kit, PA)',role:'Room',rate:0,hours:H('09:00','22:00',[0,1,2,3,4,5,6])},{id:'p6',name:'Chris (drums teacher)',role:'Teacher',rate:80,hours:H('15:00','20:00',[1,2,3,4])}],
   types:[{id:'reh',name:'Rehearsal room (2 hours)',mins:120,price:50,step:60,roles:['Room']},{id:'les30',name:'Drum lesson (30 min)',mins:30,price:40,roles:['Teacher']}]};
  const d1=addDays(today(),1),d2=addDays(today(),2);
  return {venues:[v1,v2],sample:true,waitlist:[],
   appts:[{id:'a1',ref:'MUSDEMO1',venueId:'m1',personId:'p1',typeId:'les30',mins:30,price:40,date:d1,time:'16:00',client:{name:'Sample Student',phone:'0400000011',email:'student@example.com'},extra:{inst:'Guitar',level:'Beginner'},note:'',status:'booked',paid:false,created:Date.now()},
    {id:'a2',ref:'MUSDEMO2',venueId:'m1',personId:'p3',typeId:'studio3',mins:180,price:160,date:d2,time:'13:00',client:{name:'Demo Band',phone:'0400000012',email:''},extra:{inst:'Recording, 4 piece band',level:'Gigging'},note:'',status:'booked',paid:false,created:Date.now()}],
   gigs:[{id:'g1',ref:'GIGDEMO1',venueId:'m1',personId:'p4',kind:'Wedding',date:addDays(today(),21),start:'18:00',hours:3,place:'Sample Hall, Newcastle (made up)',guests:80,name:'Sample Couple',phone:'0400000013',email:'',notes:'First dance song and a dinner set',quote:750,status:'requested',created:Date.now()}]}}};
