"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, FileText, Users, Award, Search } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ThemeSwitcher } from "@/components/theme-switcher"

interface Certificate {
  id: number
  studentName: string
  rollNumber: string
  courseName: string
  completionDate: string
  certificateType: string
  pdfPath?: string
  createdAt?: string
}

interface ActivityLog {
  id: number
  action: string
  description: string
  entityType?: string
  entityId?: number
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export default function CertificateGenerator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState("dashboard")
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    courseName: "",
    completionDate: "",
    certificateType: "",
  })

  const API_BASE_URL = "http://localhost:8080"
  const MOCK_MODE = true

  const mockActivityLogs: ActivityLog[] = []

  // Activity logging function
  const logActivity = async (action: string, description: string, entityType?: string, entityId?: number) => {
    try {
      const newLog: ActivityLog = {
        id: Math.max(...activityLogs.map(log => log.id), 0) + 1,
        action,
        description,
        entityType,
        entityId,
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.100"
      }

      if (MOCK_MODE) {
        setActivityLogs(prev => [newLog, ...prev])
        return
      }

      await fetch(`${API_BASE_URL}/api/activity-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          description,
          entityType,
          entityId
        }),
      })

      await loadActivityLogs()
    } catch (error) {
      console.error("Error logging activity:", error)
    }
  }

  // Load activity logs
  const loadActivityLogs = async () => {
    try {
      if (MOCK_MODE) {
        setActivityLogs(mockActivityLogs)
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/activity-logs`)
      if (response.ok) {
        const data = await response.json()
        setActivityLogs(data)
      }
    } catch (error) {
      console.error("Error loading activity logs:", error)
      setActivityLogs(mockActivityLogs)
    }
  }

  const mockCertificates: Certificate[] = []

  useEffect(() => {
    if (isLoggedIn) {
      loadCertificates()
      loadActivityLogs()
    }
  }, [isLoggedIn])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      
      if (MOCK_MODE) {
        setCertificates(mockCertificates)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/certificates`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      } else {
        console.error("Failed to load certificates")
        setCertificates(mockCertificates)
      }
    } catch (error) {
      console.error("Error loading certificates:", error)
      setCertificates(mockCertificates)
    } finally {
      setLoading(false)
    }
  }

  const searchCertificates = async (search: string) => {
    try {
      setLoading(true)
      
      if (MOCK_MODE) {
        const filtered = search.trim()
          ? mockCertificates.filter(cert => 
              cert.studentName.toLowerCase().includes(search.toLowerCase()) ||
              cert.rollNumber.toLowerCase().includes(search.toLowerCase())
            )
          : mockCertificates
        setCertificates(filtered)
        return
      }
      
      const url = search.trim() 
        ? `${API_BASE_URL}/api/certificates/search?q=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/api/certificates`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      } else {
        const filtered = search.trim()
          ? mockCertificates.filter(cert => 
              cert.studentName.toLowerCase().includes(search.toLowerCase()) ||
              cert.rollNumber.toLowerCase().includes(search.toLowerCase())
            )
          : mockCertificates
        setCertificates(filtered)
      }
    } catch (error) {
      console.error("Error searching certificates:", error)
      const filtered = search.trim()
        ? mockCertificates.filter(cert => 
            cert.studentName.toLowerCase().includes(search.toLowerCase()) ||
            cert.rollNumber.toLowerCase().includes(search.toLowerCase())
          )
        : mockCertificates
      setCertificates(filtered)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggedIn(true)
    
    await logActivity(
      "LOGIN", 
      "Admin user logged into the system"
    )
  }

  // Function to export certificate data to CSV
  const exportToCSV = (certificate: Certificate) => {
    try {
      const existingData = localStorage.getItem('certificatesCSV') || ''
      
      const headers = 'ID,Student Name,Roll Number,Course Name,Certificate Type,Completion Date,Created At\n'
      
      const newRow = [
        certificate.id,
        `"${certificate.studentName}"`,
        `"${certificate.rollNumber}"`,
        `"${certificate.courseName}"`,
        `"${certificate.certificateType}"`,
        certificate.completionDate,
        new Date().toISOString().split('T')[0]
      ].join(',') + '\n'
      
      let csvData = existingData
      if (!csvData.includes('ID,Student Name')) {
        csvData = headers + newRow
      } else {
        csvData += newRow
      }
      
      localStorage.setItem('certificatesCSV', csvData)
      
      downloadCSV(csvData, `certificates_${new Date().toISOString().split('T')[0]}.csv`)
      
      console.log('Certificate data exported to CSV successfully')
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    }
  }

  // Function to download CSV file
  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const exportAllCertificatesCSV = () => {
    if (certificates.length === 0) {
      alert('No certificates to export')
      return
    }

    const headers = 'ID,Student Name,Roll Number,Course Name,Certificate Type,Completion Date,Created At\n'
    const csvRows = certificates.map(cert => [
      cert.id,
      `"${cert.studentName}"`,
      `"${cert.rollNumber}"`,
      `"${cert.courseName}"`,
      `"${cert.certificateType}"`,
      cert.completionDate,
      new Date().toISOString().split('T')[0]
    ].join(','))
    
    const csvData = headers + csvRows.join('\n')
    
    localStorage.setItem('certificatesCSV', csvData)
    
    downloadCSV(csvData, `all_certificates_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      if (MOCK_MODE) {
        // Create mock certificate
        const newCertificate: Certificate = {
          id: Math.max(...certificates.map(c => c.id), 0) + 1,
          ...formData,
        }
        setCertificates([...certificates, newCertificate])
        
        // Automatically export to CSV
        exportToCSV(newCertificate)
        
        // Log activity
        await logActivity(
          "CERTIFICATE_CREATED", 
          `Created certificate for ${formData.studentName} - ${formData.courseName}`,
          "Certificate",
          newCertificate.id
        )
        
        setFormData({
          studentName: "",
          rollNumber: "",
          courseName: "",
          completionDate: "",
          certificateType: "",
        })
        setCurrentView("success")
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/certificates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newCertificate = await response.json()
        setCertificates([...certificates, newCertificate])
        
        // Automatically export to CSV
        exportToCSV(newCertificate)
        
        // Log activity
        await logActivity(
          "CERTIFICATE_CREATED", 
          `Created certificate for ${formData.studentName} - ${formData.courseName}`,
          "Certificate",
          newCertificate.id
        )
        
        setFormData({
          studentName: "",
          rollNumber: "",
          courseName: "",
          completionDate: "",
          certificateType: "",
        })
        setCurrentView("success")
        // Reload certificates to get updated list
        await loadCertificates()
      } else {
        alert("Error creating certificate")
      }
    } catch (error) {
      console.error("Error creating certificate:", error)
      // Fallback to mock creation
      const newCertificate: Certificate = {
        id: Math.max(...certificates.map(c => c.id), 0) + 1,
        ...formData,
      }
      setCertificates([...certificates, newCertificate])
      setFormData({
        studentName: "",
        rollNumber: "",
        courseName: "",
        completionDate: "",
        certificateType: "",
      })
      setCurrentView("success")
    } finally {
      setLoading(false)
    }
  }

  const generatePDFCertificate = async (certificate: Certificate) => {
    const certificateDiv = document.createElement('div');
    certificateDiv.style.position = 'fixed';
    certificateDiv.style.top = '-9999px';
    certificateDiv.style.left = '0';
    certificateDiv.style.width = '1123px';
    certificateDiv.style.height = '794px';
    certificateDiv.style.backgroundColor = 'white';
    certificateDiv.style.fontFamily = 'Times New Roman, serif';
    certificateDiv.style.overflow = 'visible';
    certificateDiv.style.zIndex = '-1000';
    
    certificateDiv.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        box-sizing: border-box;
      ">
        <div style="
          background: white;
          border: 8px solid #1e40af;
          border-radius: 0;
          padding: 30px;
          width: 100%;
          height: 100%;
          text-align: center;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- Inner decorative border -->
          <div style="
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #3b82f6;
            border-radius: 0;
          "></div>
          
          <!-- Watermark -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(59, 130, 246, 0.08);
            z-index: 0;
            font-weight: bold;
            font-family: Arial, sans-serif;
          ">CERTIFICATE</div>
          
          <!-- Content -->
          <div style="position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Header Section -->
            <div>
              <!-- Header -->
              <div style="
                font-size: 28px;
                color: #1e40af;
                margin-bottom: 15px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 4px;
                line-height: 1.2;
              ">CERTIFICATE OF COMPLETION</div>
              
              <!-- Institution -->
              <div style="
                font-size: 16px;
                color: #1e40af;
                margin-bottom: 20px;
                font-weight: bold;
              ">Indian Institute of Technology Patna</div>
              
              <!-- Certificate text -->
              <div style="
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 15px;
                color: #374151;
              ">This is to certify that</div>
              
              <!-- Student name -->
              <div style="
                font-size: 24px;
                color: #dc2626;
                font-weight: bold;
                text-transform: uppercase;
                margin: 15px 0;
                text-decoration: underline;
                text-decoration-color: #dc2626;
                text-underline-offset: 6px;
              ">${certificate.studentName}</div>
              
              <!-- Roll number -->
              <div style="
                margin: 10px 0;
                font-size: 12px;
                color: #6b7280;
              ">
                <strong>Roll Number:</strong> ${certificate.rollNumber}
              </div>
              
              <!-- Course completion text -->
              <div style="
                font-size: 14px;
                line-height: 1.6;
                margin: 15px 0;
                color: #374151;
              ">has successfully completed the course</div>
              
              <!-- Course name -->
              <div style="
                font-size: 18px;
                color: #1e40af;
                font-weight: bold;
                font-style: italic;
                margin: 15px auto;
                padding: 8px 16px;
                border-radius: 0;
                display: inline-block;
                max-width: 80%;
              ">"${certificate.courseName}"</div>
              
              <!-- Completion date -->
              <div style="
                font-size: 14px;
                line-height: 1.6;
                margin: 15px 0;
                color: #374151;
              ">on ${new Date(certificate.completionDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>

            <!-- Middle Section -->
            <div>
              <!-- Student Details Section -->
              <div style="
                margin: 20px auto;
                padding: 12px;
                background: #f8fafc;
                border-left: 4px solid #1e40af;
                width: 85%;
                max-width: 450px;
                font-size: 11px;
                color: #374151;
                text-align: left;
              ">
                <div style="font-weight: bold; color: #1e40af; margin-bottom: 6px; text-align: center;">Student Details</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold; width: 30%;">Name:</td>
                    <td style="padding: 1px 0;">${certificate.studentName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold;">Roll No:</td>
                    <td style="padding: 1px 0;">${certificate.rollNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold;">Course:</td>
                    <td style="padding: 1px 0;">${certificate.courseName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold;">Duration:</td>
                    <td style="padding: 1px 0;">Full Course</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold;">Grade:</td>
                    <td style="padding: 1px 0;">Completed Successfully</td>
                  </tr>
                  <tr>
                    <td style="padding: 1px 0; font-weight: bold;">Status:</td>
                    <td style="padding: 1px 0;">Certified</td>
                  </tr>
                </table>
              </div>

              <!-- Certificate details -->
              <div style="
                margin: 15px 0;
                font-size: 10px;
                color: #6b7280;
              ">
                <div><strong>Certificate Type:</strong> ${certificate.certificateType}</div>
                <div style="margin-top: 2px;"><strong>Certificate Number:</strong> CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}</div>
                <div style="margin-top: 2px;"><strong>Date of Issue:</strong> ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                <div style="margin-top: 2px;"><strong>Valid Until:</strong> Lifetime</div>
              </div>
            </div>

            <!-- Bottom Section -->
            <div>
              <!-- Signature section -->
              <div style="
                margin-top: 10px;
                text-align: center;
              ">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <!-- Left side - Academic Officer -->
                    <td style="width: 33%; text-align: center; vertical-align: bottom;">
                      <div style="
                        width: 120px;
                        height: 40px;
                        border: 1px dashed #9ca3af;
                        margin: 0 auto 3px auto;
                        background: #f9fafb;
                        font-size: 8px;
                        color: #6b7280;
                        line-height: 40px;
                        text-align: center;
                      ">Digital Signature</div>
                      <div style="
                        border-top: 2px solid #000;
                        width: 120px;
                        margin: 3px auto;
                      "></div>
                      <div style="font-size: 10px; color: #374151; font-weight: bold;">Academic Officer</div>
                      <div style="font-size: 8px; color: #6b7280;">IIT Patna</div>
                    </td>

                    <!-- Center - Official Seal -->
                    <td style="width: 34%; text-align: center; vertical-align: bottom;">
                      <div style="
                        width: 60px;
                        height: 60px;
                        border: 3px solid #1e40af;
                        border-radius: 50%;
                        margin: 0 auto 8px auto;
                        background: #f0f9ff;
                        color: #1e40af;
                        font-weight: bold;
                        text-align: center;
                        font-size: 7px;
                        line-height: 1;
                        padding-top: 16px;
                      ">
                        <div>OFFICIAL</div>
                        <div>SEAL</div>
                        <div style="font-size: 5px;">IIT PATNA</div>
                      </div>
                    </td>

                    <!-- Right side - Director -->
                    <td style="width: 33%; text-align: center; vertical-align: bottom;">
                      <div style="
                        width: 120px;
                        height: 40px;
                        border: 1px dashed #9ca3af;
                        margin: 0 auto 3px auto;
                        background: #f9fafb;
                        font-size: 8px;
                        color: #6b7280;
                        line-height: 40px;
                        text-align: center;
                      ">Director's Signature</div>
                      <div style="
                        border-top: 2px solid #000;
                        width: 120px;
                        margin: 3px auto;
                      "></div>
                      <div style="font-size: 10px; color: #374151; font-weight: bold;">Director</div>
                      <div style="font-size: 8px; color: #6b7280;">Indian Institute of Technology Patna</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Verification Footer -->
              <div style="
                margin-top: 10px;
                padding: 6px;
                background: #f1f5f9;
                border-radius: 4px;
                font-size: 8px;
                color: #64748b;
                text-align: center;
                border: 1px solid #e2e8f0;
              ">
                <div style="font-weight: bold; margin-bottom: 2px;">Certificate Verification</div>
                <div>This certificate can be verified at: www.iitp.ac.in/verify</div>
                <div>Verification Code: CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}-${certificate.rollNumber}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(certificateDiv);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      certificateDiv.offsetHeight;
      
      // Convert to canvas with optimized settings for better PDF generation
      const canvas = await html2canvas(certificateDiv, {
        scale: 3, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        imageTimeout: 20000,
        removeContainer: false,
        foreignObjectRendering: false,
        onclone: function(clonedDoc) {
          // Ensure all elements are properly rendered
          const clonedDiv = clonedDoc.querySelector('div');
          if (clonedDiv) {
            clonedDiv.style.fontFamily = 'Times New Roman, serif';
            clonedDiv.style.transform = 'none';
          }
        },
        ignoreElements: function(element) {
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
      
      const sanitizedName = certificate.studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Certificate_${certificate.rollNumber}_${sanitizedName}.pdf`;
      
      try {
        pdf.save(filename);
        console.log('PDF saved successfully:', filename);
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again or check your browser settings.');
      return false;
    } finally {
      document.body.removeChild(certificateDiv);
    }
  };

  const generateMockPDF = (certificate: Certificate) => {
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate - ${certificate.studentName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            background: white;
            border: 8px solid #1e40af;
            border-radius: 0;
            padding: 60px;
            max-width: 800px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #3b82f6;
            border-radius: 0;
        }
        .title {
            font-size: 32px;
            color: #1e40af;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 6px;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 40px;
            font-weight: bold;
        }
        .content {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 30px;
            color: #374151;
        }
        .student-name {
            font-size: 36px;
            color: #dc2626;
            font-weight: bold;
            text-transform: uppercase;
            margin: 30px 0;
            text-decoration: underline;
        }
        .course-name {
            font-size: 24px;
            color: #1e40af;
            font-weight: bold;
            font-style: italic;
            margin: 20px 0;
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            letter-spacing: 1px;
        }
        .details {
            margin: 30px 0;
            font-size: 16px;
            color: #6b7280;
        }
        .signature {
            margin-top: 60px;
            text-align: right;
            font-size: 16px;
            color: #374151;
        }
        .signature-line {
            border-top: 2px solid #000;
            width: 200px;
            margin: 20px 0 10px auto;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(59, 130, 246, 0.1);
            z-index: 0;
            font-weight: bold;
        }
        .content-wrapper {
            position: relative;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="watermark">IIT PATNA</div>
        <div class="content-wrapper">
            <div class="title">CERTIFICATE OF COMPLETION</div>
            <div class="subtitle">Indian Institute of Technology Patna</div>
            
            <div class="content">
                This is to certify that
            </div>
            
            <div class="student-name">${certificate.studentName}</div>
            
            <!-- Student Details Section -->
            <div style="
              margin: 25px auto;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #1e40af;
              border-radius: 0 8px 8px 0;
              font-size: 13px;
              color: #374151;
              text-align: left;
              max-width: 500px;
            ">
              <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">Student Details:</div>
              <div style="margin: 3px 0;"><strong>Name:</strong> ${certificate.studentName}</div>
              <div style="margin: 3px 0;"><strong>Roll Number:</strong> ${certificate.rollNumber}</div>
              <div style="margin: 3px 0;"><strong>Course:</strong> ${certificate.courseName}</div>
              <div style="margin: 3px 0;"><strong>Duration:</strong> Full Course</div>
              <div style="margin: 3px 0;"><strong>Grade:</strong> Completed Successfully</div>
              <div style="margin: 3px 0;"><strong>Status:</strong> Certified</div>
            </div>
            
            <div class="content">
                has successfully completed the course
            </div>
            
            <div class="course-name">"${certificate.courseName}"</div>
            
            <div class="content">
                on ${new Date(certificate.completionDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </div>
            
            <div class="details">
                <strong>Certificate Type:</strong> ${certificate.certificateType}<br>
                <strong>Certificate Number:</strong> CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}<br>
                <strong>Date of Issue:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}<br>
                <strong>Valid Until:</strong> Lifetime
            </div>
            
            <!-- Enhanced Signature Section -->
            <div style="
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: end;
            ">
              <!-- Left side - Academic Officer -->
              <div style="text-align: center;">
                <div style="
                  width: 120px;
                  height: 50px;
                  border: 1px dashed #9ca3af;
                  margin-bottom: 5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: #6b7280;
                  background: #f9fafb;
                ">Digital Signature</div>
                <div style="
                  border-top: 2px solid #000;
                  width: 120px;
                  margin: 5px 0;
                "></div>
                <div style="font-size: 12px; color: #374151; font-weight: bold;">Academic Officer</div>
                <div style="font-size: 10px; color: #6b7280;">IIT Patna</div>
              </div>

              <!-- Center - Official Seal -->
              <div style="text-align: center; margin: 0 15px;">
                <div style="
                  width: 70px;
                  height: 70px;
                  border: 3px solid #1e40af;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 9px;
                  color: #1e40af;
                  font-weight: bold;
                  text-align: center;
                  line-height: 1.2;
                  background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
                ">
                  <div>
                    <div>OFFICIAL</div>
                    <div>SEAL</div>
                    <div style="font-size: 7px;">IIT PATNA</div>
                  </div>
                </div>
              </div>

              <!-- Right side - Director -->
              <div style="text-align: center;">
                <div style="
                  width: 120px;
                  height: 50px;
                  border: 1px dashed #9ca3af;
                  margin-bottom: 5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: #6b7280;
                  background: #f9fafb;
                ">Director's Signature</div>
                <div style="
                  border-top: 2px solid #000;
                  width: 120px;
                  margin: 5px 0;
                "></div>
                <div style="font-size: 12px; color: #374151; font-weight: bold;">Director</div>
                <div style="font-size: 10px; color: #6b7280;">Indian Institute of Technology Patna</div>
              </div>
            </div>

            <!-- Verification Footer -->
            <div style="
              margin-top: 20px;
              padding: 8px;
              background: #f1f5f9;
              border-radius: 6px;
              font-size: 10px;
              color: #64748b;
              text-align: center;
              border: 1px solid #e2e8f0;
            ">
              <div style="font-weight: bold; margin-bottom: 3px;">Certificate Verification</div>
              <div>This certificate can be verified at: www.iitp.ac.in/verify</div>
              <div>Verification Code: CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}-${certificate.rollNumber}</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    return new Blob([pdfContent], { type: 'text/html' });
  }

  const downloadCertificate = async (certificate: Certificate) => {
    try {
      console.log('Starting certificate download for:', certificate.studentName);
      
      if (MOCK_MODE) {
        // Show loading indicator
        const loadingToast = document.createElement('div');
        loadingToast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 10000;
          font-family: system-ui;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        loadingToast.textContent = '🎓 Generating PDF certificate...';
        document.body.appendChild(loadingToast);
        
        try {
          // Generate actual PDF certificate with timeout
          const success = await Promise.race([
            generatePDFCertificate(certificate),
            new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 30000))
          ]);
          
          // Remove loading indicator
          document.body.removeChild(loadingToast);
          
          if (success) {
            // Show success message
            const successToast = document.createElement('div');
            successToast.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              z-index: 10000;
              font-family: system-ui;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            successToast.textContent = '✅ PDF certificate downloaded successfully!';
            document.body.appendChild(successToast);
            setTimeout(() => document.body.removeChild(successToast), 3000);
            
            // Log activity
            await logActivity(
              "CERTIFICATE_DOWNLOADED", 
              `Downloaded PDF certificate for ${certificate.studentName} - ${certificate.courseName}`,
              "Certificate",
              certificate.id
            )
          } else {
            throw new Error('PDF generation failed');
          }
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          
          // Remove loading indicator if still present
          if (document.body.contains(loadingToast)) {
            document.body.removeChild(loadingToast);
          }
          
          // Show error message
          const errorToast = document.createElement('div');
          errorToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: system-ui;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          `;
          errorToast.textContent = '⚠️ PDF generation failed. Downloading HTML version...';
          document.body.appendChild(errorToast);
          setTimeout(() => document.body.removeChild(errorToast), 4000);
          
          // Fallback to HTML if PDF generation fails
          const blob = generateMockPDF(certificate);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `certificate_${certificate.rollNumber}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          await logActivity(
            "CERTIFICATE_DOWNLOADED", 
            `Downloaded HTML certificate for ${certificate.studentName} - ${certificate.courseName} (PDF failed)`,
            "Certificate",
            certificate.id
          )
        }
        
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/certificates/${certificate.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `certificate_${certificate.rollNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Log activity
        await logActivity(
          "CERTIFICATE_DOWNLOADED", 
          `Downloaded certificate for ${certificate.studentName} - ${certificate.courseName}`,
          "Certificate",
          certificate.id
        )
      } else {
        alert("Error downloading certificate")
      }
    } catch (error) {
      console.error("Error downloading certificate:", error)
      // Fallback to PDF generation
      try {
        const success = await generatePDFCertificate(certificate);
        if (!success) {
          alert("Error generating certificate. Please try again.");
        }
      } catch (fallbackError) {
        console.error("Fallback PDF generation failed:", fallbackError);
        alert("Error generating certificate. Please try again.");
      }
    }
  }

  const viewCertificate = async (certificate: Certificate) => {
    try {
      if (MOCK_MODE) {
        // Generate mock certificate content
        const certificateContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate - ${certificate.studentName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            background: white;
            border: 8px solid #1e40af;
            border-radius: 20px;
            padding: 60px;
            max-width: 800px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #3b82f6;
            border-radius: 10px;
        }
        .title {
            font-size: 48px;
            color: #1e40af;
            margin-bottom: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .subtitle {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 40px;
            font-weight: bold;
        }
        .content {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 30px;
            color: #374151;
        }
        .student-name {
            font-size: 36px;
            color: #dc2626;
            font-weight: bold;
            text-transform: uppercase;
            margin: 30px 0;
            text-decoration: underline;
        }
        .course-name {
            font-size: 24px;
            color: #1e40af;
            font-weight: bold;
            font-style: italic;
            margin: 20px 0;
        }
        .details {
            margin: 30px 0;
            font-size: 16px;
            color: #6b7280;
        }
        .signature {
            margin-top: 60px;
            text-align: right;
            font-size: 16px;
            color: #374151;
        }
        .signature-line {
            border-top: 2px solid #000;
            width: 200px;
            margin: 20px 0 10px auto;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(59, 130, 246, 0.1);
            z-index: 0;
            font-weight: bold;
        }
        .content-wrapper {
            position: relative;
            z-index: 1;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1e40af;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        @media print {
            .print-button { display: none; }
            body { background: white; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print Certificate</button>
    <div class="certificate">
        <div class="watermark">CERTIFICATE</div>
        <div class="content-wrapper">
            <div class="title">CERTIFICATE OF COMPLETION</div>
            <div class="subtitle">Indian Institute of Technology Patna</div>
            
            <div class="content">
                This is to certify that
            </div>
            
            <div class="student-name">${certificate.studentName}</div>
            
            <!-- Student Details Section -->
            <div style="
              margin: 25px auto;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #1e40af;
              border-radius: 0 8px 8px 0;
              font-size: 13px;
              color: #374151;
              text-align: left;
              max-width: 500px;
            ">
              <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">Student Details:</div>
              <div style="margin: 3px 0;"><strong>Name:</strong> ${certificate.studentName}</div>
              <div style="margin: 3px 0;"><strong>Roll Number:</strong> ${certificate.rollNumber}</div>
              <div style="margin: 3px 0;"><strong>Course:</strong> ${certificate.courseName}</div>
              <div style="margin: 3px 0;"><strong>Duration:</strong> Full Course</div>
              <div style="margin: 3px 0;"><strong>Grade:</strong> Completed Successfully</div>
              <div style="margin: 3px 0;"><strong>Status:</strong> Certified</div>
            </div>
            
            <div class="content">
                has successfully completed the course
            </div>
            
            <div class="course-name">"${certificate.courseName}"</div>
            
            <div class="content">
                on ${new Date(certificate.completionDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </div>
            
            <div class="details">
                <strong>Certificate Type:</strong> ${certificate.certificateType}<br>
                <strong>Certificate Number:</strong> CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}<br>
                <strong>Date of Issue:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}<br>
                <strong>Valid Until:</strong> Lifetime
            </div>
            
            <!-- Enhanced Signature Section -->
            <div style="
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              align-items: end;
            ">
              <!-- Left side - Academic Officer -->
              <div style="text-align: center;">
                <div style="
                  width: 120px;
                  height: 50px;
                  border: 1px dashed #9ca3af;
                  margin-bottom: 5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: #6b7280;
                  background: #f9fafb;
                ">Digital Signature</div>
                <div style="
                  border-top: 2px solid #000;
                  width: 120px;
                  margin: 5px 0;
                "></div>
                <div style="font-size: 12px; color: #374151; font-weight: bold;">Academic Officer</div>
                <div style="font-size: 10px; color: #6b7280;">IIT Patna</div>
              </div>

              <!-- Center - Official Seal -->
              <div style="text-align: center; margin: 0 15px;">
                <div style="
                  width: 70px;
                  height: 70px;
                  border: 3px solid #1e40af;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 9px;
                  color: #1e40af;
                  font-weight: bold;
                  text-align: center;
                  line-height: 1.2;
                  background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
                ">
                  <div>
                    <div>OFFICIAL</div>
                    <div>SEAL</div>
                    <div style="font-size: 7px;">IIT PATNA</div>
                  </div>
                </div>
              </div>

              <!-- Right side - Director -->
              <div style="text-align: center;">
                <div style="
                  width: 120px;
                  height: 50px;
                  border: 1px dashed #9ca3af;
                  margin-bottom: 5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: #6b7280;
                  background: #f9fafb;
                ">Director's Signature</div>
                <div style="
                  border-top: 2px solid #000;
                  width: 120px;
                  margin: 5px 0;
                "></div>
                <div style="font-size: 12px; color: #374151; font-weight: bold;">Director</div>
                <div style="font-size: 10px; color: #6b7280;">Indian Institute of Technology Patna</div>
              </div>
            </div>

            <!-- Verification Footer -->
            <div style="
              margin-top: 20px;
              padding: 8px;
              background: #f1f5f9;
              border-radius: 6px;
              font-size: 10px;
              color: #64748b;
              text-align: center;
              border: 1px solid #e2e8f0;
            ">
              <div style="font-weight: bold; margin-bottom: 3px;">Certificate Verification</div>
              <div>This certificate can be verified at: www.iitp.ac.in/verify</div>
              <div>Verification Code: CERT-${new Date().getFullYear()}-${String(certificate.id).padStart(6, '0')}-${certificate.rollNumber}</div>
            </div>
        </div>
    </div>
</body>
</html>`;

        // Create blob and try to open in new window
        const blob = new Blob([certificateContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        
        // Try multiple approaches
        try {
          const newWindow = window.open(url, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            // Popup blocked, try alternative method
            console.log("Popup blocked, trying alternative method");
            
            // Create a temporary link and click it
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            
            // If that doesn't work, show alert and download
            setTimeout(() => {
              const a = document.createElement("a");
              a.style.display = "none";
              a.href = url;
              a.download = `certificate_${certificate.rollNumber}_view.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              alert("Certificate opened! If it didn't appear in a new tab, it has been downloaded. Please check your downloads folder.");
            }, 1000);
          }
          
          // Clean up after delay
          setTimeout(() => window.URL.revokeObjectURL(url), 5000);
          
        } catch (err) {
          console.error("Error opening certificate:", err);
          alert("Unable to open certificate in new tab. It will be downloaded instead.");
          
          // Fallback download
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `certificate_${certificate.rollNumber}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        
        // Log activity
        await logActivity(
          "CERTIFICATE_VIEWED", 
          `Viewed certificate for ${certificate.studentName} - ${certificate.courseName}`,
          "Certificate",
          certificate.id
        )
        
        return;
      }
      
      // Backend mode (when MOCK_MODE is false)
      const response = await fetch(`${API_BASE_URL}/api/certificates/${certificate.id}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const newWindow = window.open(url, "_blank")
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          alert("Popup blocked! Please allow popups for this site to view certificates.")
        }
        
        // Log activity
        await logActivity(
          "CERTIFICATE_VIEWED", 
          `Viewed certificate for ${certificate.studentName} - ${certificate.courseName}`,
          "Certificate",
          certificate.id
        )
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100)
      } else {
        alert("Error viewing certificate")
      }
    } catch (error) {
      console.error("Error viewing certificate:", error)
      alert("Error viewing certificate. Please try again.")
    }
  }

  const deleteCertificate = async (certificateId: number) => {
    if (window.confirm("Are you sure you want to delete this certificate?")) {
      try {
        const certificate = certificates.find(c => c.id === certificateId)
        
        if (MOCK_MODE) {
          // Mock delete
          setCertificates(certificates.filter((c) => c.id !== certificateId))
          
          // Log activity
          if (certificate) {
            await logActivity(
              "CERTIFICATE_DELETED", 
              `Deleted certificate for ${certificate.studentName} - ${certificate.courseName}`,
              "Certificate",
              certificateId
            )
          }
          
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/api/certificates/${certificateId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setCertificates(certificates.filter((c) => c.id !== certificateId))
          
          // Log activity
          if (certificate) {
            await logActivity(
              "CERTIFICATE_DELETED", 
              `Deleted certificate for ${certificate.studentName} - ${certificate.courseName}`,
              "Certificate",
              certificateId
            )
          }
        } else {
          alert("Error deleting certificate")
        }
      } catch (error) {
        console.error("Error deleting certificate:", error)
        // Fallback to mock delete
        setCertificates(certificates.filter((c) => c.id !== certificateId))
      }
    }
  }

  const handleSearch = async () => {
    await searchCertificates(searchTerm)
    
    // Log activity
    if (searchTerm.trim()) {
      await logActivity(
        "SEARCH", 
        `Searched for certificates with keyword: '${searchTerm}'`
      )
    }
  }

  // Helper functions for dashboard calculations
  const getCertificatesThisMonth = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return certificates.filter(cert => {
      const certDate = new Date(cert.completionDate)
      return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear
    }).length
  }

  const getUniqueStudents = () => {
    const uniqueStudents = new Set(certificates.map(cert => cert.studentName.toLowerCase()))
    return uniqueStudents.size
  }

  // Helper function to get action badge style
  const getActionBadgeStyle = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800'
    if (action.includes('VIEWED')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DOWNLOADED')) return 'bg-yellow-100 text-yellow-800'
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800'
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  // Function to remove development panels
  const removeDevPanels = () => {
    const selectors = [
      'div[style*="position: fixed"][style*="bottom"]',
      'div[style*="position: fixed"][style*="right"]',
      'div[style*="z-index: 99999"]',
      'div[style*="z-index: 9999"]',
      'div[data-nextjs]',
      'div[class*="nextjs"]'
    ]
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        const text = el.textContent || ''
        if (text.includes('Route') || text.includes('Static') || text.includes('Turbopack') || text.includes('Preferences')) {
          el.remove()
        }
      })
    })
  }

  useEffect(() => {
    removeDevPanels()
    const interval = setInterval(removeDevPanels, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-slate-900 dark:via-gray-900 dark:to-black flex items-center justify-center p-4 relative overflow-hidden transition-all duration-700">
        {/* Theme Switcher - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeSwitcher />
        </div>
        
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 dark:bg-blue-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/10 dark:bg-purple-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-20 w-60 h-60 bg-purple-300/10 dark:bg-indigo-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-purple-400/5 dark:from-blue-300/3 dark:to-purple-300/3 rounded-full blur-3xl animate-spin slow-spin"></div>
        </div>
        
        {/* Floating graduation caps with better dark mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-4xl opacity-20 dark:opacity-10 animate-bounce text-white/70 dark:text-white/50">🎓</div>
          <div className="absolute top-40 right-20 text-3xl opacity-15 dark:opacity-8 animate-bounce animation-delay-1000 text-white/60 dark:text-white/40">🎓</div>
          <div className="absolute bottom-20 left-20 text-5xl opacity-10 dark:opacity-5 animate-bounce animation-delay-2000 text-white/50 dark:text-white/30">🎓</div>
          <div className="absolute bottom-40 right-10 text-3xl opacity-20 dark:opacity-10 animate-bounce animation-delay-3000 text-white/70 dark:text-white/50">🎓</div>
        </div>

        {/* Enhanced login card with better dark mode */}
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 shadow-2xl dark:shadow-3xl ring-1 ring-white/10 dark:ring-white/5 transition-all duration-500">
          <CardHeader className="text-center pb-2">
            {/* Enhanced logo with dark mode */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-lg dark:shadow-2xl ring-4 ring-white/20 dark:ring-white/10 transition-all duration-500 hover:scale-105">
              <div className="text-5xl filter drop-shadow-lg">🎓</div>
            </div>
            
            {/* Enhanced title with better gradients */}
            <CardTitle className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 dark:from-yellow-300 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent transition-all duration-500">
              Certificate Generator
            </CardTitle>
            
            <CardDescription className="text-blue-100 dark:text-blue-200 text-lg font-medium">
              Admin Login Portal
            </CardDescription>
            
            {/* Enhanced divider */}
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 dark:from-yellow-300 dark:via-orange-400 dark:to-red-400 mx-auto rounded-full mt-3 shadow-lg"></div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white dark:text-gray-200 font-medium transition-colors duration-300">
                  Username
                </Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Enter username" 
                  required 
                  className="bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white dark:text-gray-100 placeholder-white/50 dark:placeholder-white/40 focus:border-yellow-400 dark:focus:border-yellow-300 focus:ring-yellow-400/30 dark:focus:ring-yellow-300/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white dark:text-gray-200 font-medium transition-colors duration-300">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password" 
                  required 
                  className="bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white dark:text-gray-100 placeholder-white/50 dark:placeholder-white/40 focus:border-yellow-400 dark:focus:border-yellow-300 focus:ring-yellow-400/30 dark:focus:ring-yellow-300/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10"
                />
              </div>
              
              {/* Enhanced login button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 dark:from-yellow-600 dark:to-orange-700 dark:hover:from-yellow-700 dark:hover:to-orange-800 text-white font-semibold py-3 rounded-lg shadow-lg dark:shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ring-2 ring-yellow-400/20 dark:ring-yellow-300/20 hover:ring-yellow-400/40 dark:hover:ring-yellow-300/40"
              >
                <span className="flex items-center justify-center gap-2 text-lg">
                  🔐 Login to Dashboard
                </span>
              </Button>
            </form>
            
            {/* Enhanced credentials box */}
            <div className="mt-6 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/10 ring-1 ring-white/10 dark:ring-white/5 transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
              <div className="text-sm text-blue-100 dark:text-blue-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xl">🔑</span>
                  <strong className="text-yellow-300 dark:text-yellow-200 text-base">Default Credentials</strong>
                </div>
                <div className="space-y-2 text-white/80 dark:text-white/70">
                  <div className="bg-white/10 dark:bg-white/5 px-3 py-2 rounded-lg ring-1 ring-white/10 dark:ring-white/5 transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
                    <strong>Username:</strong> <span className="font-mono text-yellow-200 dark:text-yellow-100">admin</span>
                  </div>
                  <div className="bg-white/10 dark:bg-white/5 px-3 py-2 rounded-lg ring-1 ring-white/10 dark:ring-white/5 transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
                    <strong>Password:</strong> <span className="font-mono text-yellow-200 dark:text-yellow-100">admin123</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced features preview */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/70 dark:text-white/60">
              <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.02] p-3 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 ring-1 ring-white/5 dark:ring-white/[0.02] hover:ring-white/10 dark:hover:ring-white/5">
                <span className="text-lg">📊</span>
                <span className="font-medium">Analytics</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.02] p-3 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 ring-1 ring-white/5 dark:ring-white/[0.02] hover:ring-white/10 dark:hover:ring-white/5">
                <span className="text-lg">📋</span>
                <span className="font-medium">Certificates</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.02] p-3 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 ring-1 ring-white/5 dark:ring-white/[0.02] hover:ring-white/10 dark:hover:ring-white/5">
                <span className="text-lg">📁</span>
                <span className="font-medium">CSV Export</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.02] p-3 rounded-lg transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 ring-1 ring-white/5 dark:ring-white/[0.02] hover:ring-white/10 dark:hover:ring-white/5">
                <span className="text-lg">📈</span>
                <span className="font-medium">Activity Logs</span>
              </div>
            </div>
            
            {/* Theme indicator with better styling */}
            <div className="text-center text-xs text-white/50 dark:text-white/40 flex items-center justify-center gap-2 mt-4 p-2 bg-white/5 dark:bg-white/[0.02] rounded-lg ring-1 ring-white/5 dark:ring-white/[0.02]">
              <span className="text-base">🎨</span>
              <span className="font-medium">Theme controls available in top-right corner</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Enhanced footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/50 dark:text-white/40 text-sm backdrop-blur-sm bg-white/5 dark:bg-white/[0.02] px-4 py-2 rounded-full ring-1 ring-white/10 dark:ring-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <span className="font-medium">Indian Institute of Technology Patna</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
      </div>
      
      {/* Header */}
      <header className="bg-white/10 dark:bg-white/5 backdrop-blur-sm text-white shadow-2xl border-b border-white/20 dark:border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white drop-shadow-lg">
              <span className="text-4xl">🎓</span>
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Certificate Generator
              </span>
            </h1>
            <nav className="flex gap-4">
              <Button
                variant={currentView === "dashboard" ? "secondary" : "ghost"}
                onClick={() => setCurrentView("dashboard")}
                className={`text-white font-medium transition-all duration-300 ${
                  currentView === "dashboard" 
                    ? "bg-white/20 hover:bg-white/30 shadow-lg ring-2 ring-white/20" 
                    : "hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  📊 Dashboard
                </span>
              </Button>
              <Button
                variant={currentView === "new" ? "secondary" : "ghost"}
                onClick={() => setCurrentView("new")}
                className={`text-white font-medium transition-all duration-300 ${
                  currentView === "new" 
                    ? "bg-white/20 hover:bg-white/30 shadow-lg ring-2 ring-white/20" 
                    : "hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  ➕ New Certificate
                </span>
              </Button>
              <Button
                variant={currentView === "list" ? "secondary" : "ghost"}
                onClick={() => setCurrentView("list")}
                className={`text-white font-medium transition-all duration-300 ${
                  currentView === "list" 
                    ? "bg-white/20 hover:bg-white/30 shadow-lg ring-2 ring-white/20" 
                    : "hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  📋 All Certificates
                </span>
              </Button>
              <Button
                variant={currentView === "activity" ? "secondary" : "ghost"}
                onClick={() => {
                  setCurrentView("activity")
                  loadActivityLogs()
                }}
                className={`text-white font-medium transition-all duration-300 ${
                  currentView === "activity" 
                    ? "bg-white/20 hover:bg-white/30 shadow-lg ring-2 ring-white/20" 
                    : "hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  📊 Activity Logs
                </span>
              </Button>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <Button 
                  variant="ghost" 
                  onClick={() => setIsLoggedIn(false)} 
                  className="text-white font-medium transition-all duration-300 hover:bg-red-500/20 hover:text-red-200 border border-transparent hover:border-red-400/30"
                >
                  <span className="flex items-center gap-2">
                    🚪 Logout
                  </span>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10 dark:ring-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">Total Certificates</CardTitle>
                  <Award className="h-5 w-5 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white drop-shadow-lg">{certificates.length}</div>
                  <p className="text-xs text-white/70 mt-1">Generated certificates</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10 dark:ring-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">This Month</CardTitle>
                  <Calendar className="h-5 w-5 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white drop-shadow-lg">{getCertificatesThisMonth()}</div>
                  <p className="text-xs text-white/70 mt-1">New this month</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10 dark:ring-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">Students</CardTitle>
                  <Users className="h-5 w-5 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white drop-shadow-lg">{getUniqueStudents()}</div>
                  <p className="text-xs text-white/70 mt-1">Unique recipients</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl ring-1 ring-white/10 dark:ring-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    Recent Certificates
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportAllCertificatesCSV}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white transition-all duration-300"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </CardTitle>
                <CardDescription className="text-white/70">Latest certificates generated - automatically saved to CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{cert.studentName}</h4>
                        <p className="text-sm text-gray-600">{cert.courseName}</p>
                        <p className="text-xs text-gray-500">Roll: {cert.rollNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => viewCertificate(cert)}
                          title="View certificate in new tab"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => downloadCertificate(cert)}
                          title="Download PDF certificate"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Certificate Form */}
        {currentView === "new" && (
          <Card className="max-w-2xl mx-auto bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl ring-1 ring-white/10 dark:ring-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Create New Certificate
              </CardTitle>
              <CardDescription className="text-white/70">Fill in the student details to generate a professional certificate</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCertificate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName" className="text-white font-medium">Student Name *</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-yellow-400/30 backdrop-blur-sm"
                      placeholder="Enter student's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber" className="text-white font-medium">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-yellow-400/30 backdrop-blur-sm"
                      placeholder="Enter roll number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName" className="text-white font-medium">Course/Event Name *</Label>
                    <Input
                      id="courseName"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-yellow-400/30 backdrop-blur-sm"
                      placeholder="Enter course or event name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificateType" className="text-white font-medium">Certificate Type *</Label>
                    <Select
                      value={formData.certificateType}
                      onValueChange={(value) => setFormData({ ...formData, certificateType: value })}
                    >
                      <SelectTrigger className="bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white dark:text-gray-100 focus:border-yellow-400 dark:focus:border-yellow-300 focus:ring-yellow-400/30 dark:focus:ring-yellow-300/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
                        <SelectValue placeholder="Select certificate type" className="text-white/70 dark:text-white/60" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-white/30 dark:border-white/20 shadow-2xl">
                        <SelectItem value="Course Completion" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">📚 Course Completion</SelectItem>
                        <SelectItem value="Workshop" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🔧 Workshop</SelectItem>
                        <SelectItem value="Seminar" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🎤 Seminar</SelectItem>
                        <SelectItem value="Training" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🏋️ Training</SelectItem>
                        <SelectItem value="Achievement" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🏆 Achievement</SelectItem>
                        <SelectItem value="Participation" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">✨ Participation</SelectItem>
                        <SelectItem value="Excellence" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">💫 Excellence</SelectItem>
                        <SelectItem value="Honor" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🌟 Honor</SelectItem>
                        <SelectItem value="Merit" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">⭐ Merit</SelectItem>
                        <SelectItem value="Special Recognition" className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-800/30">🎖️ Special Recognition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionDate" className="text-white font-medium">Completion Date *</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    required
                    className="bg-white/10 border-white/30 text-white focus:border-yellow-400 focus:ring-yellow-400/30 backdrop-blur-sm"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105" 
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Creating...
                        </>
                      ) : (
                        <>
                          🎓 Generate Certificate
                        </>
                      )}
                    </span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentView("dashboard")}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      ← Cancel
                    </span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success View */}
        {currentView === "success" && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Certificate Created Successfully!</h2>
              <p className="text-gray-600 mb-4">The certificate has been generated and is ready for download as a professional PDF.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  📊 <strong>Auto-Export:</strong> Certificate data has been automatically saved to CSV file and downloaded to your computer.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-green-700">
                  📄 <strong>PDF Ready:</strong> High-quality PDF certificate with official seal and signatures is ready for download.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={() => viewCertificate(certificates[certificates.length - 1])}>👁️ View Certificate</Button>
                <Button variant="outline" onClick={() => downloadCertificate(certificates[certificates.length - 1])}>
                  � Download PDF
                </Button>
                <Button variant="outline" onClick={() => setCurrentView("new")}>
                  ➕ Create Another
                </Button>
                <Button variant="outline" onClick={() => setCurrentView("list")}>
                  📋 View All Certificates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate List */}
        {currentView === "list" && (
          <div className="space-y-6">
            <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl ring-1 ring-white/10 dark:ring-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-400" />
                  Search Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Search by student name or roll number..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-yellow-400 focus:ring-yellow-400/30 backdrop-blur-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => loadCertificates()}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border-white/20 dark:border-white/10 text-white shadow-2xl ring-1 ring-white/10 dark:ring-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-400" />
                    All Certificates
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportAllCertificatesCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export All CSV
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage all generated certificates. Click 👁️ to view or 📥 to download certificates. Data automatically saved to CSV.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p>Loading certificates...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Student Name</th>
                          <th className="text-left p-2">Roll Number</th>
                          <th className="text-left p-2">Course</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((cert) => (
                          <tr key={cert.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{cert.studentName}</td>
                            <td className="p-2">{cert.rollNumber}</td>
                            <td className="p-2">{cert.courseName}</td>
                            <td className="p-2">{cert.certificateType}</td>
                            <td className="p-2">{new Date(cert.completionDate).toLocaleDateString()}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => viewCertificate(cert)}
                                  title="View certificate in new tab"
                                >
                                  👁️
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => downloadCertificate(cert)}
                                  title="Download PDF certificate"
                                >
                                  �
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCertificate(cert.id)}
                                  title="Delete certificate"
                                >
                                  🗑️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {certificates.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        No certificates found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Logs View */}
        {currentView === "activity" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Activity Logs
                </CardTitle>
                <CardDescription>
                  Track all system activities and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading activity logs...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <Button 
                        onClick={() => loadActivityLogs()}
                        size="sm"
                        variant="outline"
                      >
                        🔄 Refresh
                      </Button>
                      <div className="text-sm text-gray-500">
                        Total Activities: {activityLogs.length}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Timestamp</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Entity</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-sm">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeStyle(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">
                                {log.description}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-sm">
                                {log.entityType ? `${log.entityType} #${log.entityId}` : '-'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-500">
                                {log.ipAddress || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {activityLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No activity logs found
                        </div>
                      )}
                    </div>

                    {/* Activity Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {activityLogs.filter(log => log.action.includes('CREATED')).length}
                          </div>
                          <div className="text-sm text-gray-500">Certificates Created</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {activityLogs.filter(log => log.action.includes('VIEWED')).length}
                          </div>
                          <div className="text-sm text-gray-500">Views</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {activityLogs.filter(log => log.action.includes('DOWNLOADED')).length}
                          </div>
                          <div className="text-sm text-gray-500">Downloads</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {activityLogs.filter(log => log.action.includes('LOGIN')).length}
                          </div>
                          <div className="text-sm text-gray-500">Logins</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
