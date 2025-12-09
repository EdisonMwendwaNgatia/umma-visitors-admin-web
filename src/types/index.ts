export interface Visitor {
  id: string;
  visitorName: string;
  phoneNumber: string;
  idNumber: string;
  refNumber?: string; 
  residence: string;
  institutionOccupation: string;
  purposeOfVisit: string;
  gender: string; 
  tagNumber?: string; 
  tagNotGiven?: boolean; 
  timeIn: Date;
  timeOut?: Date;
  signIn?: string; 
  signOut?: string; 
  visitorType: 'foot' | 'vehicle';
  checkedInBy: string; 
  checkedOutBy?: string; 
  isCheckedOut: boolean;

  editedBy?: string;
  lastEditedAt?: Date;
  editHistory?: VisitorEditHistory[];
}

export interface VisitorEditHistory {
  field: string;
  oldValue: any;
  newValue: any;
  editedBy: string;
  editedAt: Date | any;
}

export interface Stats {
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  overdueVisitors: number;
  vehicleVisitors: number;
  footVisitors: number;
  checkedOutVisitors: number;
  maleVisitors: number;
  femaleVisitors: number;
  otherGenderVisitors: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string; 
  role?: string; 
}